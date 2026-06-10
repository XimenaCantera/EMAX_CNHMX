# Plantilla base para las aplicaciones de Dash
PLANTILLA_HTML_CARGANDO = '''
<!DOCTYPE html>
<html>
    <head>
        {%metas%}
        <title>{%title%}</title>
        {%favicon%}
        {%css%}
        <style>
            ._dash-loading {
                font-family: 'Outfit', sans-serif;
                text-align: center;
                padding: 30px;
                color: #64748b;
                font-size: 16px;
                visibility: hidden;
            }
            ._dash-loading::after {
                content: "Cargando panel...";
                visibility: visible;
                display: block;
            }
        </style>
    </head>
    <body>
        {%app_entry%}
        <footer>
            {%config%}
            {%scripts%}
            {%renderer%}
            <script>
                document.addEventListener("DOMContentLoaded", function() {
                    var puntoEntrada = document.getElementById('react-entry-point');
                    if (puntoEntrada) {
                        var observador = new MutationObserver(function(mutaciones) {
                            var cargandoEl = document.querySelector('._dash-loading');
                            if (!cargandoEl && puntoEntrada.children.length > 0) {
                                window.parent.postMessage({ type: 'DASH_LOADED' }, '*');
                                observador.disconnect();

                                // Enviar altura real al padre en intervalos para capturar renders tardíos de Plotly
                                var enviarAltura = function() {
                                    var altura = document.documentElement.scrollHeight;
                                    window.parent.postMessage({ type: 'DASH_HEIGHT', height: altura }, '*');
                                };
                                setTimeout(enviarAltura, 500);
                                setTimeout(enviarAltura, 1500);
                                setTimeout(enviarAltura, 3000);
                                setTimeout(enviarAltura, 5000);
                            }
                        });
                        observador.observe(puntoEntrada, { childList: true, subtree: true });
                        
                        // Caso por si ya cargó antes de iniciar el script
                        var cargandoEl = document.querySelector('._dash-loading');
                        if (!cargandoEl && puntoEntrada.children.length > 0) {
                            window.parent.postMessage({ type: 'DASH_LOADED' }, '*');
                            observador.disconnect();
                            var enviarAltura = function() {
                                var altura = document.documentElement.scrollHeight;
                                window.parent.postMessage({ type: 'DASH_HEIGHT', height: altura }, '*');
                            };
                            setTimeout(enviarAltura, 500);
                            setTimeout(enviarAltura, 1500);
                            setTimeout(enviarAltura, 3000);
                            setTimeout(enviarAltura, 5000);
                        }
                    }
                });
            </script>
        </footer>
    </body>
</html>
'''