// worker/seed-team.mjs
// Usage: node worker/seed-team.mjs <email> <pin>
// Example: node worker/seed-team.mjs stefvandijk10@gmail.com 1234

import { randomBytes, pbkdf2 } from 'node:crypto'
import { randomUUID } from 'node:crypto'

const [, , email, pin] = process.argv
if (!email || !pin) {
  console.error('Usage: node worker/seed-team.mjs <email> <pin>')
  process.exit(1)
}

const salt = randomBytes(16)
const id = randomUUID()

pbkdf2(pin, salt, 100_000, 32, 'sha256', (err, hash) => {
  if (err) throw err
  const pinHash = salt.toString('base64') + '.' + hash.toString('base64')
  console.log(
    `INSERT OR IGNORE INTO team_members (id, email, display_name, pin_hash) VALUES ('${id}', '${email.toLowerCase()}', NULL, '${pinHash}');`
  )
})
