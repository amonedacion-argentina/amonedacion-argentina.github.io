document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contacto-form");
  const contactoSection = document.getElementById("contacto");
  const graciasSection = document.getElementById("gracias");
  const volverBtn = document.getElementById("volver-form");
  const statusDiv = document.getElementById("form-status");
  const jsonDisplay = document.getElementById("jsonDisplay");

  graciasSection.style.display = "none";

  form.addEventListener("submit", function(event) {
    event.preventDefault();
    statusDiv.textContent = "";

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
      statusDiv.textContent = i18nData.contacto.error_campos;
      statusDiv.style.color = "red";
      return;
    }

    statusDiv.textContent = i18nData.contacto.enviando;
    statusDiv.style.color = "black";

    fetch(this.action, {
      method: this.method,
      body: new FormData(this),
      headers: { 'Accept': 'application/json' }
    }).then(response => {
      if (response.ok) {
        contactoSection.style.display = "none";
        graciasSection.style.display = "block";
        statusDiv.textContent = "";

        const datos = {
          nombre: form.nombre.value,
          email: form.email.value,
          mensaje: form.mensaje.value
        };
        jsonDisplay.textContent = JSON.stringify(datos, null, 2);

        form.reset();
      } else {
        return response.json().then(data => {
          throw new Error(data.message || i18nData.contacto.error_envio);
        });
      }
    }).catch(error => {
      statusDiv.textContent = error.message || i18nData.contacto.error_conexion;
      statusDiv.style.color = "red";
    });
  });

  volverBtn.addEventListener("click", () => {
    graciasSection.style.display = "none";
    contactoSection.style.display = "block";
    statusDiv.textContent = "";
  });
});
