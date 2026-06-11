// Generate a bcrypt hash for the admin password.
//   npm run hash-password -- "my-new-password"
// Copy the printed hash into ADMIN_PASSWORD_HASH in .env
import bcrypt from 'bcryptjs'

const password = process.argv[2]
if (!password) {
  console.error('Usage: npm run hash-password -- "your-password"')
  process.exit(1)
}

const hash = bcrypt.hashSync(password, 12)
console.log(hash)
