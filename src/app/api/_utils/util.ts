import crypto from "crypto";

function generate_new_id() {
  const uuid = crypto.randomUUID();
  return uuid;
}

export { generate_new_id };
