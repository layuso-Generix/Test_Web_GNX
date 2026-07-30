1. Usuario hace click en una card.
2. router.js identifica la card seleccionada.
3. La card viene de SITE_CONFIG.sections[].cards[].
4. router.js llama a RendererFactory.create(card.group).
5. RendererFactory devuelve el renderer correspondiente.
6. El renderer recibe:
   - card
   - container
   - services
7. El renderer carga los recursos desde card.dir.
8. El renderer interpreta el contenido según su lógica funcional.
9. El renderer pinta su layout específico.
10. Los componentes internos se inicializan:
    - búsqueda
    - navegación
    - árbol schema
    - timeline
    - descargas