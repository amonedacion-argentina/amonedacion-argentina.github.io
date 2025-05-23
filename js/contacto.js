document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contacto-form");
  const contactoSection = document.getElementById("contacto");
  const graciasSection = document.getElementById("gracias");
  const volverBtn = document.getElementById("volver-form");
  const statusDiv = document.getElementById("form-status");

  form.addEventListener("submit", function(event) {
    event.preventDefault();
    statusDiv.textContent = "";
    
    // Validación simple
    let valid = true;
    [...form.elements].forEach(input => {
      if (input.required && !input.value.trim()) {
        valid = false;
        input.classList.add("input-error");
      } else {
        input.classList.remove("input-error");
      }
    });

    if (!valid) {
      statusDiv.textContent = "Por favor, completa todos los campos obligatorios.";
      statusDiv.style.color = "red";
      return;
    }

    statusDiv.textContent = "Enviando...";
    statusDiv.style.color = "black";

    fetch(this.action, {
      method: this.method,
      body: new FormData(this),
      headers: { 'Accept': 'application/json' }
    }).then(response => {
      if (response.ok) {
        contactoSection.style.display = "none";
        graciasSection.style.display = "block";
        form.reset();
        statusDiv.textContent = "";
      } else {
        return response.json().then(data => {
          throw new Error(data.message || "Hubo un problema enviando el formulario.");
        });
      }
    }).catch(error => {
      statusDiv.textContent = error.message || "Error de conexión. Intenta de nuevo más tarde.";
      statusDiv.style.color = "red";
    });
  });

  volverBtn.addEventListener("click", () => {
    graciasSection.style.display = "none";
    contactoSection.style.display = "block";
  });
});