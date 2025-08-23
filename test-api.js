// Teste simples da API Python
const API_URL = 'http://localhost:8000/api'

async function testRegister() {
  try {
    const testData = {
      username: 'test_user',
      email: 'test@example.com',
      password: 'test123',
      password_confirm: 'test123',
      first_name: 'Test',
      last_name: 'User',
      ssn: '12345678901',
      institution: 'Test University',
      position: 'Student'
    }

    console.log('Testando registro com dados:', testData)

    const response = await fetch(`${API_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })

    console.log('Status:', response.status)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Erro da API:', errorData)
    } else {
      const data = await response.json()
      console.log('Sucesso:', data)
    }
  } catch (error) {
    console.error('Erro de conexão:', error)
  }
}

// Executar teste
testRegister()

