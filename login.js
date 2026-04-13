const BASE_URL = "http://localhost:3000/api";

const form = document.getElementById("loginForm");
const matriculaInput = document.getElementById("matricula");
const senhaInput = document.getElementById("senha");
const errorMessage = document.getElementById("errorMessage");
const submitBtn = document.querySelector(".login-btn");

// função de login
async function login(matricula, senha) {
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ matricula, senha })
    });

    // erro da API (resposta recebida, mas com erro)
    if (!response.ok) {
      let message = "Erro ao fazer login";

      try {
        const data = await response.json();
        message = data.message || message;
      } catch {
        if (response.status === 401) {
          message = "Usuário ou senha inválidos";
        } else if (response.status === 404) {
          message = "Usuário não encontrado";
        }
      }

      throw new Error(message);
    }

    return response.json();

  } catch (error) {
    mostrarErro("Erro de conexão com o servidor");
  }
}

// salva sessão
function saveSession(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
}

// redireciona
function redirect() {
  window.location.href = "/index.html";
}

// loading no botão (UX melhor)
function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "Entrando..." : "Entrar";
}

// exibe erro
function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.style.display = "block";
}

// submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const matricula = matriculaInput.value.trim();
  const senha = senhaInput.value.trim();

  errorMessage.style.display = "none";

  if (!matricula || !senha) {
    showError("Preencha todos os campos.");
    return;
  }

  try {
    setLoading(true);

    const data = await login(matricula, senha);

    saveSession(data);
    redirect();

  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
});