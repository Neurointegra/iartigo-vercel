const bcrypt = require('bcryptjs')

// Teste da senha que o usuário está tentando usar
const testPassword = 'diego070'
const hashedPassword = '$2b$10$zwekApcHbanTivChWPBLyufgP56v/eClnlLKUxH9PU73zX4EcKmyi'

console.log('Testando validação de senha...')
console.log('Senha de teste:', testPassword)
console.log('Hash armazenado:', hashedPassword)

// Testar se a senha está correta
bcrypt.compare(testPassword, hashedPassword).then(isValid => {
  console.log('Senha válida?', isValid)
  
  if (!isValid) {
    console.log('A senha não está batendo com o hash!')
    console.log('Vamos gerar um novo hash para a senha correta...')
    
    bcrypt.hash(testPassword, 10).then(newHash => {
      console.log('Novo hash para a senha:', newHash)
    })
  }
})

