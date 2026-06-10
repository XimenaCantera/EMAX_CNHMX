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
                        var observador = new MutationObserver(function() {
                            var cargandoEl = document.querySelector('._dash-loading');
                            if (!cargandoEl && puntoEntrada.children.length > 0) {
                                observador.disconnect();
                                window.parent.postMessage({ type: 'DASH_LOADED' }, '*');
                                
                                // Esperar a que Plotly termine de renderizar
                                setTimeout(function() {
                                    var altura = document.documentElement.scrollHeight;
                                    window.parent.postMessage({ type: 'DASH_HEIGHT', height: altura }, '*');
                                }, 3000);
                                setTimeout(function() {
                                    var altura = document.documentElement.scrollHeight;
                                    window.parent.postMessage({ type: 'DASH_HEIGHT', height: altura }, '*');
                                }, 5000);
                            }
                        });
                        observador.observe(puntoEntrada, { childList: true, subtree: true });
                    }
                });
            </script>
        </footer>
    </body>
</html>
'''