const initials = (name = "") =>
  name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();

export default function Avatar({ user, size = "normal" }) {
  return (
    <span className={`avatar ${size}`}>
      {user?.avatar ? <img src={user.avatar} alt="" /> : initials(user?.name || "U")}
    </span>
  );
}
