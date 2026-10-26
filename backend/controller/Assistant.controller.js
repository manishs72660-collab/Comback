const Task = require("../models/Task.models.js");
const Routine = require("../models/Routine.models.js");
const DailyLog = require("../models/Dailylog.models.js");
const User = require("../models/user.models.js");
const { buildSummaries } = require("../service/Routine.service.js");
const { addDays, todayString } = require("../utils/Date.js");
const redisClient = require("../config/redis.js");

const callAssistant = async (messages, { responseFormat } = {}) => {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error("AI is not configured. Set GROQ_API_KEY on the backend.");
    error.status = 503;
    throw error;
  }
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-20b",
      messages,
      temperature: 0.6,
      ...(responseFormat ? { response_format: responseFormat, max_completion_tokens: 2048 } : {}),
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    console.error("AI provider request failed with status:", response.status);
    const error = new Error("AI provider request failed");
    error.status = 502;
    throw error;
  }
  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content;
  if (typeof answer !== "string" || !answer.trim()) throw new Error("AI provider returned an empty response");
  return answer.trim();
};

const parseJsonObject = (value) => {
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch (initialError) {
    const start = cleaned.indexOf("{");
    if (start < 0) throw initialError;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < cleaned.length; index += 1) {
      const character = cleaned[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === "\"") inString = false;
        continue;
      }
      if (character === "\"") inString = true;
      else if (character === "{") depth += 1;
      else if (character === "}") {
        depth -= 1;
        if (depth === 0) return JSON.parse(cleaned.slice(start, index + 1));
      }
    }
    throw initialError;
  }
};

const getUserContext = async (userId) => {
  const today = todayString();
  const [tasks, pendingCount, routines, recentLogs, summaries, user] = await Promise.all([
    Task.find({ userId, status: "pending" }).sort({ deadline: 1 }).limit(100).lean(),
    Task.countDocuments({ userId, status: "pending" }),
    Routine.find({ userId }).select("title category timeOfDay reminderTime startDate isActive isArchived").sort({ createdAt: -1 }).limit(100).lean(),
    DailyLog.find({ userId, date: { $gte: addDays(today, -29), $lte: today } }).sort({ date: -1 }).limit(150).lean(),
    buildSummaries(userId, addDays(today, -6), today, today),
    User.findById(userId).select("goals").lean(),
  ]);
  const activeDays = summaries.filter((day) => day.status !== "none");
  const completedDays = activeDays.filter((day) => day.status === "completed").length;
  const routineNames = new Map(routines.map((routine) => [routine._id.toString(), routine.title]));
  return {
    today,
    goals: user?.goals || [],
    pendingTaskCount: pendingCount,
    tasks: tasks.map(({ title, description, deadline, priority }) => ({ title, description, deadline, priority })),
    routines: routines.map(({ _id, title, category, timeOfDay, reminderTime, startDate, isActive, isArchived }) => ({
      id: _id, title, category, timeOfDay, reminderTime, startDate, isActive, isArchived,
    })),
    recentRoutineHistory: recentLogs.map(({ routineId, date, status }) => ({
      routine: routineNames.get(routineId.toString()) || "Deleted routine", date, status,
    })),
    thisWeek: { activeDays: activeDays.length, completedDays, completionRate: activeDays.length ? Math.round(completedDays / activeDays.length * 100) : 0 },
  };
};

const chat = async (req, res) => {
  try {
    if (!Array.isArray(req.body.messages) || req.body.messages.length === 0 || req.body.messages.length > 16) {
      return res.status(400).json({ success: false, message: "Send 1 to 16 chat messages" });
    }
    const messages = req.body.messages.filter((message) =>
      message && ["user", "assistant"].includes(message.role) && typeof message.content === "string"
    ).map((message) => ({ role: message.role, content: message.content.slice(0, 4000) }));
    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return res.status(400).json({ success: false, message: "The latest message must be from the user" });
    }
    const context = await getUserContext(req.user._id);
    const system = `You are Comeback, a concise and supportive planning assistant. Use only this user's private data to answer questions. The current date is ${context.today}. Ask a follow-up if a deadline is unclear. If the user asks to create tasks, return a JSON object with "reply" (string) and "tasks" (array of {title,description,deadline,priority}); use ISO date YYYY-MM-DD for deadlines, priority low/medium/high, and an empty tasks array otherwise. If no tasks are requested, reply naturally. User data: ${JSON.stringify(context)}`;
    const answer = await callAssistant([{ role: "system", content: system }, ...messages]);
    let reply = answer;
    let createdTasks = [];
    try {
      const structured = JSON.parse(answer.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
      if (structured && Array.isArray(structured.tasks)) {
        reply = String(structured.reply || "I added those tasks to your list.");
        const candidates = structured.tasks.slice(0, 10).filter((task) =>
          task && typeof task.title === "string" && task.title.trim()
        ).map((task) => ({
          userId: req.user._id,
          title: task.title.trim().slice(0, 160),
          description: String(task.description || "").slice(0, 1000),
          deadline: task.deadline && !Number.isNaN(Date.parse(task.deadline)) ? new Date(task.deadline) : null,
          priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : "medium",
        }));
        if (candidates.length) createdTasks = await Task.insertMany(candidates);
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        reply = answer.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      } else {
        throw error;
      }
    }
    res.json({ success: true, reply, createdTasks });
  } catch (error) {
    console.error("Assistant chat error:", error);
    res.status(error.status || 502).json({ success: false, message: error.message || "Assistant request failed" });
  }
};

const suggestSchedule = async (req, res) => {
  try {
    const context = await getUserContext(req.user._id);
    const answer = await callAssistant([
      { role: "system", content: `Create a realistic day plan using only the user's actual pending tasks, deadlines, habits, and goals. Include reasonable breaks. Return a JSON object with "plan" (array of objects with "time" as HH:mm, "title", "reason", and "taskTitle" as an exact pending task title or empty string) and "note" (short string). Do not invent tasks or extra fields. Current date: ${context.today}. User data: ${JSON.stringify(context)}` },
      { role: "user", content: "Suggest today's schedule. Respect urgency and leave breaks." },
    ], {
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "daily_schedule",
          strict: true,
          schema: {
            type: "object",
            properties: {
              plan: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    time: { type: "string" },
                    title: { type: "string" },
                    reason: { type: "string" },
                    taskTitle: { type: "string" },
                  },
                  required: ["time", "title", "reason", "taskTitle"],
                  additionalProperties: false,
                },
              },
              note: { type: "string" },
            },
            required: ["plan", "note"],
            additionalProperties: false,
          },
        },
      },
    });
    let plan;
    try {
      plan = parseJsonObject(answer);
    } catch (error) {
      console.error("Assistant schedule returned invalid JSON");
      return res.status(502).json({ success: false, message: "The AI returned an invalid schedule. Please try again." });
    }
    if (!plan || !Array.isArray(plan.plan) || plan.plan.some((item) =>
      !item || typeof item.time !== "string" || typeof item.title !== "string" || typeof item.reason !== "string"
    )) {
      return res.status(502).json({ success: false, message: "The AI returned an incomplete schedule. Please try again." });
    }
    plan.plan = plan.plan.slice(0, 12).map(({ time, title, reason, taskTitle }) => ({
      time: time.slice(0, 20),
      title: title.slice(0, 160),
      reason: reason.slice(0, 300),
      taskTitle: typeof taskTitle === "string" ? taskTitle.slice(0, 160) : "",
    }));
    plan.note = typeof plan.note === "string" ? plan.note.slice(0, 300) : "";
    res.json({ success: true, ...plan });
  } catch (error) {
    console.error("Assistant schedule error:", error);
    res.status(error.status || 502).json({ success: false, message: error.message || "Unable to suggest a schedule" });
  }
};

const getQuote = async (req, res) => {
  const date = todayString();
  const cacheKey = `quote:${req.user._id}:${date}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json({ success: true, quote: cached, date });
    const context = await getUserContext(req.user._id);
    const quote = await callAssistant([
      { role: "system", content: "Give one original, warm, short motivational quote (under 20 words), personalized to the user's goals. Return only the quote, without quotation marks or attribution." },
      { role: "user", content: JSON.stringify({ goals: context.goals, progress: context.thisWeek }) },
    ]);
    await redisClient.set(cacheKey, quote, { EX: 60 * 60 * 24 });
    res.json({ success: true, quote, date });
  } catch (error) {
    console.error("Assistant quote error:", error);
    res.status(error.status || 502).json({ success: false, message: error.message || "Unable to generate today's quote" });
  }
};

module.exports = { chat, suggestSchedule, getQuote, parseJsonObject };
