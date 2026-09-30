const handleError = require("../utils/Handleerror.js");
const { isValidDateString, todayString, addDays } = require("../utils/Date.js");
const {
  getDayView,
  buildSummaries,
  computeStreaks,
} = require("../service/Routine.service.js");

const STREAK_WINDOW_DAYS = 365;
const HISTORY_DAYS = 30;
const HEATMAP_DAYS = 120;

// GET /dashboard?date=YYYY-MM-DD
// Everything the first page needs in one request.

const getDashboard = async (req, res) => {
  try {
    const today = req.query.date === undefined ? todayString() : req.query.date;
    if (!isValidDateString(today)) {
      return res.status(400).json({
        success: false,
        message: "date must be YYYY-MM-DD",
      });
    }

    const userId = req.user._id;
    const from = addDays(today, -(STREAK_WINDOW_DAYS - 1));

    const [todayView, summaries] = await Promise.all([
      getDayView(userId, today),
      buildSummaries(userId, from, today, today),
    ]);

    const streak = computeStreaks(summaries, today);

    const history = summaries.slice(-HISTORY_DAYS).reverse();
    const heatmap = summaries
      .slice(-HEATMAP_DAYS)
      .map(({ date, percent, status }) => ({ date, percent, status }));

    // Stats for the last 30 days (only days that had routines)
    const activeDays = history.filter((d) => d.status !== "none");
    const completedDays = activeDays.filter((d) => d.status === "completed").length;
    const stats = {
      last30Days: {
        activeDays: activeDays.length,
        completedDays,
        completionRate:
          activeDays.length === 0
            ? 0
            : Math.round((completedDays / activeDays.length) * 100),
      },
    };

    return res.status(200).json({
      success: true,
      date: today,
      today: todayView,
      streak,
      stats,
      history,
      heatmap,
    });
  } catch (error) {
    return handleError(res, error, "Dashboard Error");
  }
};

module.exports = { getDashboard };