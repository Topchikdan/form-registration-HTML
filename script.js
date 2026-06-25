(function () {
    "use strict";

    /* ── Element refs ── */
    const form        = document.getElementById("login-form");
    const emailInput  = document.getElementById("email");
    const pwInput     = document.getElementById("password");
    const togglePw    = document.getElementById("toggle-pw");
    const btnSubmit   = document.getElementById("btn-submit");
    const alertEl     = document.getElementById("alert");
    const alertMsg    = document.getElementById("alert-msg");

    /* ────────────────────────────────────────
       Password visibility toggle
    ──────────────────────────────────────── */
    togglePw.addEventListener("click", function () {
        const show = pwInput.type === "password";
        pwInput.type = show ? "text" : "password";

        this.setAttribute("aria-pressed", String(show));
        this.setAttribute("aria-label", show ? "Hide password" : "Show password");

        this.querySelector(".icon-eye").style.display     = show ? "none" : "";
        this.querySelector(".icon-eye-off").style.display = show ? ""     : "none";

        // Return focus to input so the cursor stays in place
        pwInput.focus();
    });

    /* ────────────────────────────────────────
       Validation helpers
    ──────────────────────────────────────── */
    function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    }

    function setError(inputId, errorId, message) {
        const fieldEl = document.getElementById(inputId).closest(".field");
        const errorEl = document.getElementById(errorId);
        fieldEl.classList.add("has-error");
        errorEl.textContent = message;
    }

    function clearError(inputId, errorId) {
        const fieldEl = document.getElementById(inputId).closest(".field");
        const errorEl = document.getElementById(errorId);
        fieldEl.classList.remove("has-error");
        errorEl.textContent = "";
    }

    function validateEmail(silent = false) {
        const value = emailInput.value.trim();
        if (!value) {
            if (!silent) setError("email", "email-error", "Email is required.");
            return false;
        }
        if (!isValidEmail(value)) {
            if (!silent) setError("email", "email-error", "Enter a valid email address.");
            return false;
        }
        clearError("email", "email-error");
        return true;
    }

    function validatePassword(silent = false) {
        const value = pwInput.value;
        if (!value) {
            if (!silent) setError("password", "password-error", "Password is required.");
            return false;
        }
        if (value.length < 6) {
            if (!silent) setError("password", "password-error", "Must be at least 6 characters.");
            return false;
        }
        clearError("password", "password-error");
        return true;
    }

    /* ────────────────────────────────────────
       Live validation (blur → validate;
       input → clear error as soon as valid)
    ──────────────────────────────────────── */
    emailInput.addEventListener("blur",  () => validateEmail());
    pwInput   .addEventListener("blur",  () => validatePassword());

    emailInput.addEventListener("input", () => {
        // Hide auth error banner as soon as the user starts correcting
        hideAlert();
        if (emailInput.closest(".field").classList.contains("has-error")) {
            validateEmail(/* silent = */ true) && clearError("email", "email-error");
        }
    });

    pwInput.addEventListener("input", () => {
        // Hide auth error banner as soon as the user starts correcting
        hideAlert();
        if (pwInput.closest(".field").classList.contains("has-error")) {
            validatePassword(/* silent = */ true) && clearError("password", "password-error");
        }
    });

    /* ────────────────────────────────────────
       Alert helpers
    ──────────────────────────────────────── */
    function showAlert(message) {
        alertMsg.textContent = message;
        alertEl.hidden = false;
        // Force reflow so the CSS animation re-triggers if alert was already visible
        alertEl.style.animation = "none";
        alertEl.offsetHeight; // eslint-disable-line no-unused-expressions
        alertEl.style.animation = "";
    }

    function hideAlert() {
        alertEl.hidden = true;
    }

    /* ────────────────────────────────────────
       Loading state
    ──────────────────────────────────────── */
    function setLoading(on) {
        btnSubmit.disabled = on;
        btnSubmit.classList.toggle("loading", on);
    }

    /* ────────────────────────────────────────
       Form submit
    ──────────────────────────────────────── */
    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        hideAlert();

        const emailOk = validateEmail();
        const pwOk    = validatePassword();

        // Focus the first invalid field
        if (!emailOk) { emailInput.focus(); return; }
        if (!pwOk)    { pwInput.focus();    return; }

        setLoading(true);

        try {
            await fakeAuthRequest(emailInput.value.trim(), pwInput.value);

            // ✅ Success — show a brief confirmation then redirect
            btnSubmit.querySelector(".btn-submit__text") // kept hidden by loading class
            // In production: window.location.href = "/dashboard";
            showSuccessState();

        } catch (err) {
            showAlert(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    });

    /* ────────────────────────────────────────
       Success state (demo only)
    ──────────────────────────────────────── */
    function showSuccessState() {
        // Re-enable button and show a checkmark
        btnSubmit.disabled = false;
        btnSubmit.classList.remove("loading");
        btnSubmit.classList.add("success");
        btnSubmit.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5"/>
            </svg>
            Signed in!
        `;
        btnSubmit.style.background = "linear-gradient(135deg, #059669, #10b981)";
        btnSubmit.style.boxShadow  = "0 4px 16px rgba(16,185,129,0.35)";
    }

    /* ────────────────────────────────────────
       OAuth button placeholders
       (wire these up with the provider's SDK)
    ──────────────────────────────────────── */
    document.querySelectorAll(".btn-oauth").forEach((btn) => {
        btn.addEventListener("click", function () {
            const name = this.querySelector("span").textContent;
            // Replace with actual OAuth flow:
            // e.g. window.location.href = `/auth/${name.toLowerCase()}`;
            alert(`${name} OAuth — connect your provider SDK here.`);
        });
    });

    /* ────────────────────────────────────────
       Fake auth — replace with real fetch()
    ──────────────────────────────────────── */
    function fakeAuthRequest(email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email === "demo@vela.app" && password === "password123") {
                    resolve({ token: "demo-token-xyz" });
                } else {
                    reject(new Error("Incorrect email or password."));
                }
            }, 1300);
        });
    }
})();
