export const SALT_ROUNDS = 12;

// Compared against when a login email does not exist, so a missing account costs the
// same bcrypt work as a wrong password and response time does not reveal which it was.
export const DUMMY_PASSWORD_HASH = "$2b$12$LhxYJCMlU5MPj.ImFpxu1uEb3WM/j.uH2SloJ8CCJU5HhTK0q24n.";
