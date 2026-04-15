/* ==========================================
   LP AUXÍLIO ACIDENTE - JAVASCRIPT
   ========================================== */

document.addEventListener('DOMContentLoaded', function () {

    // --- SCROLL ANIMATIONS (FADE IN) ---
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add fade-in to key elements
    const animateElements = document.querySelectorAll(
        '.spotlight-card, .identification-card, .objection-card, .stat-card, .testimonial-card, ' +
        '.explanation-wrapper, .qualification-wrapper, .form-wrapper, ' +
        '.authority-wrapper, .urgency-wrapper, .final-cta-wrapper, .section-testimonials .section-header'
    );
    animateElements.forEach(function (el) {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    // --- COUNTER ANIMATION ---
    const counters = document.querySelectorAll('.stat-number');
    const counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(function (counter) {
        counterObserver.observe(counter);
    });

    function animateCounter(el) {
        var target = parseInt(el.getAttribute('data-target'));
        var duration = 2000;
        var start = 0;
        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            var current = Math.floor(eased * target);
            el.textContent = current.toLocaleString('pt-BR');
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = target.toLocaleString('pt-BR');
            }
        }
        requestAnimationFrame(step);
    }

    // --- PHONE MASK ---
    var whatsappInput = document.getElementById('whatsapp');
    if (whatsappInput) {
        whatsappInput.addEventListener('input', function (e) {
            var value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.substring(0, 11);

            if (value.length > 6) {
                value = '(' + value.substring(0, 2) + ') ' + value.substring(2, 7) + '-' + value.substring(7);
            } else if (value.length > 2) {
                value = '(' + value.substring(0, 2) + ') ' + value.substring(2);
            } else if (value.length > 0) {
                value = '(' + value;
            }
            e.target.value = value;
        });
    }

    // --- QUALIFICATION CHECKLIST ---
    var checkboxes = document.querySelectorAll('.qualification-item input');
    var resultText = document.getElementById('qualificationResult');

    checkboxes.forEach(function (cb) {
        cb.addEventListener('change', function () {
            var checked = document.querySelectorAll('.qualification-item input:checked').length;
            if (checked > 0) {
                resultText.classList.add('active');
                if (checked === 1) {
                    resultText.innerHTML = 'Você marcou <strong>1 item</strong>. Vale a análise!';
                } else {
                    resultText.innerHTML = 'Você marcou <strong>' + checked + ' itens</strong>. Você provavelmente tem direito!';
                }
            } else {
                resultText.classList.remove('active');
                resultText.innerHTML = 'Se marcou pelo menos 1, <strong>vale a análise.</strong>';
            }
        });
    });

    // --- WEBHOOK N8N ---
    // Substitua pela URL real do webhook no n8n
    var WEBHOOK_URL = 'https://conexoes.skychat.com.br/webhook/emerson-auxilio-acidente';

    function sendToWebhook(data) {
        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).catch(function (error) {
            console.error('Erro ao enviar dados para o webhook:', error);
        });
    }

    // --- FORM SUBMISSION ---
    var form = document.getElementById('leadForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var nome = document.getElementById('nome').value.trim();
            var whatsapp = document.getElementById('whatsapp').value.trim();
            var cidade = document.getElementById('cidade').value.trim();
            var estado = document.getElementById('estado').value;
            var trabalha = document.querySelector('input[name="trabalha"]:checked');
            var acidente = document.querySelector('input[name="acidente"]:checked');
            var sequela = document.querySelector('input[name="sequela"]:checked');

            if (!nome || !whatsapp || !cidade || !estado || !trabalha || !acidente || !sequela) {
                // Remove erro anterior se existir
                var oldError = form.querySelector('.form-error');
                if (oldError) oldError.remove();

                // Cria mensagem de erro visual
                var errorMsg = document.createElement('p');
                errorMsg.className = 'form-error';
                errorMsg.textContent = 'Por favor, preencha todos os campos.';
                form.querySelector('button[type="submit"]').insertAdjacentElement('beforebegin', errorMsg);

                // Remove depois de 4 segundos
                setTimeout(function () { errorMsg.remove(); }, 4000);
                return;
            }

            // Remove erro se existir ao enviar com sucesso
            var existingError = form.querySelector('.form-error');
            if (existingError) existingError.remove();

            // Envia para o webhook do n8n
            sendToWebhook({
                nome: nome,
                whatsapp: whatsapp,
                cidade: cidade,
                estado: estado,
                trabalhaAtualmente: trabalha.value,
                sofreuAcidente: acidente.value,
                ficouComSequela: sequela.value
            });

            // Build WhatsApp message
            var message = 'Olá! Vim pela landing page do Auxílio-Acidente.\n\n' +
                '*Nome:* ' + nome + '\n' +
                '*WhatsApp:* ' + whatsapp + '\n' +
                '*Cidade/Estado:* ' + cidade + '/' + estado + '\n' +
                '*Trabalha atualmente:* ' + trabalha.value + '\n' +
                '*Sofreu acidente:* ' + acidente.value + '\n' +
                '*Ficou com sequela:* ' + sequela.value + '\n\n' +
                'Gostaria de saber se tenho direito ao auxílio-acidente.';

            var encodedMessage = encodeURIComponent(message);
            // Substitua o número abaixo pelo número real
            var whatsappURL = 'https://wa.me/5500000000000?text=' + encodedMessage;

            window.open(whatsappURL, '_blank');

            // Show success
            var submitBtn = form.querySelector('button[type="submit"]');
            var originalText = submitBtn.textContent;
            submitBtn.textContent = 'Enviado com sucesso!';
            submitBtn.classList.add('btn--sent');
            submitBtn.disabled = true;

            setTimeout(function () {
                submitBtn.textContent = originalText;
                submitBtn.classList.remove('btn--sent');
                submitBtn.disabled = false;
            }, 3000);
        });
    }

    // --- HEADER SCROLL EFFECT ---
    var header = document.querySelector('.header');
    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            header.style.padding = '10px 0';
            header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.3)';
        } else {
            header.style.padding = '16px 0';
            header.style.boxShadow = 'none';
        }
    });

    // --- SMOOTH SCROLL FOR ANCHOR LINKS ---
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                var headerHeight = document.querySelector('.header').offsetHeight;
                var targetPos = target.getBoundingClientRect().top + window.scrollY - headerHeight;
                window.scrollTo({ top: targetPos, behavior: 'smooth' });
            }
        });
    });

    // --- SOCIAL PROOF NOTIFICATION ---
    var names = [
        { name: 'Maria', city: 'São Paulo' },
        { name: 'João', city: 'Belo Horizonte' },
        { name: 'Ana', city: 'Rio de Janeiro' },
        { name: 'Carlos', city: 'Curitiba' },
        { name: 'Fernanda', city: 'Salvador' },
        { name: 'Pedro', city: 'Fortaleza' },
        { name: 'Juliana', city: 'Brasília' },
        { name: 'Roberto', city: 'Porto Alegre' },
        { name: 'Luciana', city: 'Recife' },
        { name: 'Marcos', city: 'Goiânia' }
    ];

    var notification = document.getElementById('socialNotification');
    var notifName = document.getElementById('notifName');
    var notifCity = document.getElementById('notifCity');
    var notifIndex = 0;

    function showNotification() {
        var person = names[notifIndex % names.length];
        notifName.textContent = person.name;
        notifCity.textContent = person.city;
        notification.classList.add('show');

        setTimeout(function () {
            notification.classList.remove('show');
        }, 4000);

        notifIndex++;
    }

    // First notification after 8 seconds, then every 15-25 seconds
    setTimeout(function () {
        showNotification();
        setInterval(function () {
            var delay = Math.random() * 10000 + 15000;
            setTimeout(showNotification, delay);
        }, 25000);
    }, 8000);

});
