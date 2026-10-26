const cloudinary = require("cloudinary").v2;

const cloudinaryReady = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

const uploadImage = (buffer, folder) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder, resource_type: "image" }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    }).end(buffer);
  });

const getProfile = async (req, res) => {
  res.json({ success: true, user: req.user });
};

const updateProfile = async (req, res) => {
  try {
    const { name, bio, goals } = req.body;
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
        return res.status(400).json({ success: false, message: "Name must be between 1 and 80 characters" });
      }
      req.user.name = name.trim();
    }
    if (bio !== undefined) req.user.bio = String(bio).trim().slice(0, 240);
    if (goals !== undefined) {
      const parsedGoals = Array.isArray(goals) ? goals : String(goals).split(",");
      req.user.goals = parsedGoals.map((goal) => String(goal).trim()).filter(Boolean).slice(0, 10);
    }
    await req.user.save();
    res.json({ success: true, user: req.user });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: "Unable to update profile" });
  }
};

const uploadMedia = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "Select an image to upload" });
  if (!cloudinaryReady()) {
    return res.status(503).json({ success: false, message: "Image uploads are not configured. Set the Cloudinary environment variables." });
  }
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    const kind = req.params.kind === "wallpaper" ? "wallpaper" : req.params.kind === "avatar" ? "avatar" : null;
    if (!kind) return res.status(400).json({ success: false, message: "Image type must be avatar or wallpaper" });
    const result = await uploadImage(req.file.buffer, `comeback/${kind}/${req.user._id}`);
    req.user[kind] = result.secure_url;
    await req.user.save();
    res.json({ success: true, [kind]: result.secure_url, user: req.user });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(502).json({ success: false, message: "Image upload failed" });
  }
};

const removeWallpaper = async (req, res) => {
  try {
    req.user.wallpaper = "";
    await req.user.save();
    res.json({ success: true, user: req.user });
  } catch (error) {
    console.error("Remove wallpaper error:", error);
    res.status(500).json({ success: false, message: "Unable to remove wallpaper" });
  }
};

module.exports = { getProfile, updateProfile, uploadMedia, removeWallpaper };
