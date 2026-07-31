export interface GuideSection {
  heading: string;
  content: string;
}

export interface Guide {
  slug: string;
  title: string;
  kicker: string;
  readTime: string;
  description: string;
  body: GuideSection[];
}

export const GUIDES_ES: Guide[] = [
  {
    slug: "tipos-de-cannabis",
    title: "Sativa, Indica e Híbridas: qué significan realmente",
    kicker: "Básicos",
    readTime: "6 min",
    description:
      "Las etiquetas sativa e indica son útiles para comunicarse, pero la ciencia dice algo distinto. Descubre qué determina realmente la experiencia.",
    body: [
      {
        heading: "El origen de las etiquetas",
        content:
          "Los términos sativa e indica tienen raíces botánicas del siglo XVIII — Carl Linnaeus describió Cannabis sativa en Europa, mientras que Jean-Baptiste Lamarck clasificó Cannabis indica en Asia Central. Con el tiempo, la industria adoptó estas palabras como atajos para describir efectos: sativa para energía y enfoque, indica para relajación y sueño. El problema es que esta clasificación popular no tiene base científica sólida.",
      },
      {
        heading: "Lo que dice la ciencia",
        content:
          "Investigaciones recientes, incluyendo estudios de Leafly y el trabajo del doctor Ethan Russo, muestran que los efectos del cannabis dependen principalmente del perfil de cannabinoides (THC, CBD, CBG, etc.) y de los terpenos — no de si la planta es morfológicamente sativa o indica. Una planta clasificada como sativa puede tener un perfil de terpenos relajante, y viceversa. Lo que sientes depende de la química, no de la etiqueta.",
      },
      {
        heading: "¿Entonces para qué sirven las etiquetas?",
        content:
          "Siguen siendo útiles como lenguaje común. Cuando alguien dice que busca algo 'tipo sativa', está comunicando una preferencia de experiencia que el vendedor o la comunidad entiende. En WeedHub usamos las etiquetas Sativa, Indica e Híbrida como punto de partida, pero complementamos con datos de terpenos, efectos reportados y calificaciones de la comunidad para darte una imagen más completa.",
      },
      {
        heading: "Las híbridas y los espectros modernos",
        content:
          "La mayoría de las cepas comerciales modernas son híbridas con décadas de cruzamiento genético. Pocas cepas son 'puras' en términos genéticos. Lo que importa para tu experiencia es el porcentaje de THC y CBD, el perfil de terpenos dominantes (¿mirceno? ¿limoneno? ¿pineno?) y tu propia tolerancia y contexto de consumo.",
      },
    ],
  },
  {
    slug: "terpenos-que-son",
    title: "Terpenos: qué son y por qué importan más que el THC",
    kicker: "Ciencia",
    readTime: "8 min",
    description:
      "El aroma del cannabis es obra de los terpenos, pero su influencia va mucho más allá del olfato. Entiende el efecto séquito y cómo los terpenos modulan tu experiencia.",
    body: [
      {
        heading: "¿Qué son los terpenos?",
        content:
          "Los terpenos son compuestos aromáticos presentes en miles de plantas: el limoneno da el olor cítrico al limón, el pineno es el aroma del pino, el mirceno está en el lúpulo. El cannabis produce más de 200 terpenos distintos, aunque cada cepa tiene entre 5 y 15 dominantes. Evolutivamente, sirven para atraer polinizadores y repeler insectos. En humanos, tienen efectos fisiológicos comprobados.",
      },
      {
        heading: "El efecto séquito (entourage effect)",
        content:
          "La teoría del efecto séquito, propuesta por los investigadores Raphael Mechoulam y Shimon Ben-Shabat, sugiere que los cannabinoides y terpenos actúan en sinergia. El THC solo produce un efecto, pero combinado con ciertos terpenos, esos efectos se modulan. Por ejemplo, el mirceno potencia la permeabilidad de la barrera hematoencefálica (puede intensificar el efecto del THC), mientras que el limoneno tiene propiedades ansiolíticas que pueden contrarrestar la ansiedad que genera el THC en dosis altas.",
      },
      {
        heading: "Los terpenos más comunes y sus efectos",
        content:
          "Mirceno: el más abundante en el cannabis comercial. Asociado a efectos sedantes y relajantes. Aroma terroso/herbal. Presente en mango y lúpulo. Limoneno: cítrico y energizante. Asociado a elevación del ánimo y reducción del estrés. Pineno: aroma de pino. Puede mejorar la memoria y tiene propiedades antiinflamatorias. Linalool: floral (similar a la lavanda). Efectos ansiolíticos y sedantes. Cariofileno: el único terpeno que también actúa como cannabinoide, uniéndose a receptores CB2. Antiinflamatorio. Presente en pimienta negra.",
      },
      {
        heading: "Cómo usar esta información",
        content:
          "Cuando explores una cepa en WeedHub, revisa los terpenos dominantes. Si buscas algo energizante, prioriza cepas con limoneno o pineno. Si buscas relajación, busca mirceno o linalool. Los terpenos sobreviven mejor a temperaturas bajas de vaporización (170–185°C) que en combustión directa, donde muchos se destruyen antes de que los inhales.",
      },
    ],
  },
  {
    slug: "cannabinoides-thc-cbd",
    title: "THC, CBD y los otros cannabinoides: guía básica",
    kicker: "Ciencia",
    readTime: "7 min",
    description:
      "THC y CBD son los más conocidos, pero el cannabis produce más de 100 cannabinoides distintos. Aprende cómo funcionan y qué diferencia a cada uno.",
    body: [
      {
        heading: "El sistema endocannabinoide",
        content:
          "Los cannabinoides funcionan porque los humanos tenemos un sistema endocannabinoide (SEC) — una red de receptores (CB1 y CB2) y moléculas señalizadoras que regulan el dolor, el estado de ánimo, el apetito, la memoria y la inflamación. El cuerpo produce sus propios cannabinoides (endocannabinoides como la anandamida), y los fitocannabinoides del cannabis interactúan con este mismo sistema.",
      },
      {
        heading: "THC: el cannabinoide psicoactivo",
        content:
          "El tetrahidrocannabinol (THC) es el principal responsable de los efectos psicoactivos del cannabis. Se une directamente a los receptores CB1 en el cerebro, produciendo euforia, alteración de la percepción temporal y, en dosis altas, puede provocar ansiedad o paranoia en personas predispuestas. El THC también tiene propiedades analgésicas, antieméticas (reduce náuseas) y estimulantes del apetito.",
      },
      {
        heading: "CBD: equilibrio sin euforia",
        content:
          "El cannabidiol (CBD) no produce efectos psicoactivos. No se une directamente a los receptores CB1 — en cambio, los modula indirectamente y actúa en otros sistemas (serotonina, vainilloide). El CBD tiene propiedades ansiolíticas, antiinflamatorias y anticonvulsivas comprobadas. También puede contrarrestar algunos efectos adversos del THC, como la ansiedad. Cepas con ratio THC:CBD equilibrado suelen ser más manejables para principiantes.",
      },
      {
        heading: "Otros cannabinoides relevantes",
        content:
          "CBG (cannabigerol): el 'precursor' del que se sintetizan THC y CBD en la planta. Tiene propiedades antibacterianas y neuroprotectoras. CBN (cannabinol): se forma cuando el THC se degrada por oxidación. Asociado a efectos sedantes. CBC (cannabicromeno): antiinflamatorio, puede contribuir al efecto séquito. THCV (tetrahidrocannabivarina): presente en algunas cepas africanas, puede suprimir el apetito (a diferencia del THC) y tiene efectos más cortos e intensos.",
      },
    ],
  },
  {
    slug: "metodos-de-consumo",
    title: "Fumar, vaporizar, comestibles: diferencias clave",
    kicker: "Básicos",
    readTime: "6 min",
    description:
      "El método de consumo cambia radicalmente la velocidad, intensidad y duración de los efectos. Conocer estas diferencias te ayuda a tomar decisiones más informadas.",
    body: [
      {
        heading: "Combustión (fumar)",
        content:
          "Es el método más tradicional. La inhalación de humo lleva los cannabinoides al torrente sanguíneo a través de los pulmones en 2–10 minutos. Los efectos duran entre 1 y 3 horas. La combustión destruye parte de los terpenos (a temperaturas de 230°C+) y produce subproductos de la quema. Es el método más familiar pero menos eficiente en términos de cannabinoides aprovechables.",
      },
      {
        heading: "Vaporización",
        content:
          "El vaporizador calienta el cannabis a temperaturas de 160–220°C, suficientes para liberar cannabinoides y terpenos sin alcanzar la combustión. Inicio de efectos en 5–15 minutos. Los efectos suelen ser más limpios y con más expresión de terpenos — muchos usuarios reportan poder distinguir mejor el sabor específico de cada cepa. Es el método más recomendado para quienes buscan preservar el perfil de la planta.",
      },
      {
        heading: "Comestibles",
        content:
          "Al ingerir cannabis, el THC es procesado por el hígado, que lo convierte en 11-hidroxi-THC — un metabolito más potente y de acción más lenta. El inicio de efectos puede tardar de 30 minutos a 2 horas dependiendo de tu metabolismo y si comiste antes. Los efectos duran entre 4 y 8 horas, son más intensos y de mayor duración que la inhalación. El error más común: asumir que 'no está funcionando' y consumir más antes de esperar suficiente tiempo.",
      },
      {
        heading: "Concentrados y otros métodos",
        content:
          "Los concentrados (hash, resina, aceites, shatter, wax) tienen potencias de THC entre 40% y 90%+. Se consumen generalmente mediante dab rigs o vaporizadores especializados. Los sublinguales (aceites bajo la lengua) tienen un inicio de 15–45 minutos con efectos moderados. Los tópicos (cremas, bálsamos) actúan localmente sin efectos sistémicos — útiles para inflamación o dolor localizado.",
      },
    ],
  },
  {
    slug: "como-leer-una-resena",
    title: "Cómo interpretar una reseña en WeedHub",
    kicker: "WeedHub",
    readTime: "5 min",
    description:
      "Las reseñas de WeedHub capturan más que una calificación. Aprende a leer el contexto detrás de cada experiencia para encontrar lo que realmente buscas.",
    body: [
      {
        heading: "Por qué el contexto importa",
        content:
          "La experiencia con el cannabis es profundamente contextual. La misma cepa puede producir efectos muy distintos dependiendo de si la consumiste en la mañana antes de trabajar, en la noche para relajarte, solo o con amigos, con tolerancia alta o baja. Por eso en WeedHub pedimos a cada reseñador que capture el método, el momento y el setting — no solo una calificación del 1 al 5.",
      },
      {
        heading: "Las seis dimensiones de calificación",
        content:
          "Calificación general: la impresión global de la experiencia. Potencia: qué tan intenso fue el efecto en relación a lo esperado. Sabor: la experiencia sensorial durante el consumo. Aroma: la fragancia antes y durante el consumo. Apariencia: la calidad visual de la flor o producto. Efectos: qué tan bien produjo los efectos que buscabas. Juntas, estas dimensiones te dan un perfil mucho más rico que una sola nota.",
      },
      {
        heading: "Filtrar por contexto similar al tuyo",
        content:
          "Si buscas algo para consumir por la noche solo para descansar, las reseñas más relevantes son aquellas donde el reseñador indicó 'Noche' y 'Solo' como contexto. Si eres principiante, busca reseñas de personas que indicaron poca frecuencia de consumo. El perfil de cada reseña te da pistas sobre si la experiencia es comparable a la que tú tendrías.",
      },
      {
        heading: "Efectos reportados vs. efectos esperados",
        content:
          "Los efectos listados en el perfil de una cepa (Relajación, Euforia, Concentración) son un promedio de lo que la comunidad reportó. Cada persona tiene un sistema endocannabinoide distinto — lo que produce 'Calma' en una persona puede producir 'Energía' en otra. Lee los efectos reportados como tendencias estadísticas, no como garantías. Las reseñas individuales te dan la textura cualitativa que los promedios no pueden capturar.",
      },
    ],
  },
  {
    slug: "primeras-veces",
    title: "Primera vez con cannabis: qué esperar y cómo prepararte",
    kicker: "Básicos",
    readTime: "7 min",
    description:
      "Una guía honesta para principiantes. Qué pasa en tu cuerpo, cómo elegir tu primera cepa, la regla del 'empieza bajo y ve despacio' y qué hacer si te sientes incómodo.",
    body: [
      {
        heading: "Antes de empezar",
        content:
          "El cannabis no es para todo el mundo, y está bien. Antes de probar, infórmate: el THC activa receptores en tu cerebro que no has activado antes, y la experiencia puede ser muy diferente de lo que esperas. Lo más importante: no tienes prisa. La primera vez no necesita ser intensa para ser buena. Elige un momento tranquilo, sin compromisos importantes al día siguiente, y con personas de confianza si es posible.",
      },
      {
        heading: "Elegir la cepa adecuada para empezar",
        content:
          "Para la primera vez, busca cepas con THC moderado (entre 10% y 16%) y algo de CBD — el CBD suaviza los efectos del THC y reduce la probabilidad de ansiedad. Cepas con dominancia de mirceno o linalool tienden a ser más relajantes. Evita concentrados, aceites de alta potencia (30%+ THC) o edibles para la primera experiencia: son más difíciles de dosificar. En el directorio de WeedHub puedes filtrar por tipo y ver los efectos reportados por la comunidad.",
      },
      {
        heading: "La regla de oro: empieza bajo, ve despacio",
        content:
          "Tanto si fumas, vaporizas o pruebas un comestible, empieza con una dosis pequeña y espera. Si inhalas, da una sola calada y espera 10–15 minutos antes de decidir si quieres más. Si es un comestible, espera al menos 90 minutos antes de tomar otra dosis — el error más común es asumir que 'no está funcionando' y duplicar la dosis, lo que lleva a experiencias abrumadoras. El cannabis casero y los productos no etiquetados tienen potencias impredecibles.",
      },
      {
        heading: "Qué esperar que sientas",
        content:
          "Con una dosis baja podrías sentir relajación muscular, ligera euforia, mayor apreciación de la música o la comida, y cierta distorsión del tiempo (los minutos parecen más largos). Con dosis más altas pueden aparecer latidos acelerados, boca seca, ojos rojos y mayor sensibilidad a los estímulos. Todo esto es normal y temporal. Los efectos de inhalación duran entre 1 y 3 horas. Los comestibles pueden durar 4–6 horas.",
      },
      {
        heading: "Si te sientes incómodo: el protocolo de 5 pasos",
        content:
          "Si experimentas ansiedad, pánico o malestar: 1) Recuerda que es temporal — ningún adulto sano ha muerto por una sobredosis de cannabis. Pasará. 2) Cambia de ambiente — sal a un espacio tranquilo, siéntate o acuéstate. 3) Respira despacio — inhala en 4 tiempos, exhala en 6. 4) Bebe agua fría o come algo azucarado — ambos pueden reducir la intensidad. 5) No te quedes solo si estás muy incómodo — dile a alguien cómo te sientes. El CBD en aceite sublingual también puede contrarrestar la ansiedad por THC.",
      },
    ],
  },
  {
    slug: "almacenamiento-cannabis",
    title: "Cómo conservar tu cannabis: guía de almacenamiento",
    kicker: "Básicos",
    readTime: "5 min",
    description:
      "El mal almacenamiento destruye terpenos, degrada el THC y puede provocar moho. Aprende cómo guardar tu hierba para que se mantenga fresca semanas o meses.",
    body: [
      {
        heading: "Por qué importa el almacenamiento",
        content:
          "El cannabis bien conservado mantiene su aroma, potencia y perfil de terpenos por meses. Mal guardado, puede perder hasta el 50% de sus terpenos en una semana y el THC se convierte gradualmente en CBN (menos potente, más sedante). Peor: la humedad excesiva favorece el crecimiento de moho, que puede causar problemas respiratorios. El almacenamiento correcto es parte del respeto al producto.",
      },
      {
        heading: "Los cuatro enemigos: luz, calor, humedad y aire",
        content:
          "Luz UV: degrada el THC y los terpenos — nunca guardes cannabis en recipientes transparentes expuestos al sol. Calor: temperaturas por encima de 25°C aceleran la degradación y favorecen el moho. Calor excesivo también evapora los terpenos, robándole aroma y sabor a tu hierba. Humedad: entre 59% y 63% de humedad relativa es el rango ideal. Por debajo se reseca (pierde terpenos), por arriba puede aparecer moho. Aire: el oxígeno oxida el THC — minimiza el espacio de aire en tu recipiente.",
      },
      {
        heading: "El contenedor ideal",
        content:
          "Frasco de vidrio oscuro con tapa hermética — el estándar de oro. El vidrio no aporta sabores extraños (como puede hacerlo el plástico), es impermeable al aire y fácil de limpiar. Añade un pack de humedad Boveda 62% para mantener la HR perfecta sin esfuerzo. Evita bolsas de plástico zip: generan electricidad estática que desprende tricomas y no controlan la humedad. Las cajas de madera de cedro son bonitas pero pueden transferir sabores.",
      },
      {
        heading: "Cuánto dura bien guardada",
        content:
          "Con almacenamiento correcto (vidrio oscuro, temperatura entre 15–20°C, HR 59–63%): flores frescas mantienen potencia y aroma óptimos durante 6 meses; siguen siendo consumibles hasta 1–2 años con pérdida gradual de terpenos. Concentrados (resina, hachís) duran menos si están expuestos al aire pero pueden conservarse bien en frío. Comestibles siguen las fechas de sus ingredientes. En el freezer puedes conservar flores por años, pero los tricomas se vuelven frágiles al congelar — maneja con cuidado.",
      },
      {
        heading: "Errores comunes a evitar",
        content:
          "Guardar en el baño: demasiada humedad y temperatura variable. Usar el mismo recipiente para varias cepas: los perfiles de terpenos se mezclan. Guardar junto a tabaco: el cannabis absorbe olores. Abrir el frasco constantemente: cada apertura introduce aire y humedad. Guardar accesibles para niños o mascotas: el cannabis debe guardarse bajo llave o en lugares fuera de su alcance, igual que cualquier sustancia controlada.",
      },
    ],
  },
  {
    slug: "terpenos-por-cepa",
    title: "Qué terpenos buscar según el efecto que quieres",
    kicker: "Ciencia",
    readTime: "6 min",
    description:
      "Cada efecto que buscas tiene un perfil de terpenos asociado. Esta guía te ayuda a leer los perfiles de WeedHub para encontrar cepas alineadas con tus objetivos.",
    body: [
      {
        heading: "Por qué los terpenos son tu mejor filtro",
        content:
          "El porcentaje de THC te dice qué tan potente puede ser una cepa, pero no te dice cómo va a sentirse. Dos cepas con 20% THC pueden producir experiencias radicalmente distintas si tienen perfiles de terpenos diferentes. Los terpenos modulan cómo el THC interactúa con tu sistema nervioso — por eso aprender a leer un perfil de terpenos es más valioso que perseguir el mayor porcentaje de THC.",
      },
      {
        heading: "Para relajación y alivio del estrés",
        content:
          "Busca: mirceno, linalool, nerolidol. El mirceno es el terpeno más abundante en cannabis comercial y el principal responsable de efectos sedantes — presente en cepas como OG Kush, Granddaddy Purple y muchas indicas clásicas. El linalool (también en lavanda) tiene efectos ansiolíticos documentados. El nerolidol tiene propiedades sedantes y se encuentra en cepas de floración tardía. Si quieres relajarte por la noche, prioriza cepas con mirceno como terpeno dominante.",
      },
      {
        heading: "Para energía y enfoque",
        content:
          "Busca: limoneno, terpinoleno, pineno. El limoneno eleva el estado de ánimo y tiene propiedades ansiolíticas que permiten una euforia funcional — presente en Durban Poison, Super Lemon Haze, Tangie. El terpinoleno tiene un perfil fresco, floral y frutal, asociado con efectos energizantes y creativos. El pineno puede mejorar la memoria y la claridad mental. Ideal para consumo diurno, actividades creativas o trabajo.",
      },
      {
        heading: "Para alivio del dolor e inflamación",
        content:
          "Busca: cariofileno, humuleno, mirceno. El cariofileno (también en pimienta negra) es el único terpeno que actúa como cannabinoide, uniéndose directamente a receptores CB2 antiinflamatorios. Cepas con alto cariofileno incluyen GSC (Girl Scout Cookies), Bubba Kush y Death Star. El humuleno también tiene propiedades antiinflamatorias y está en el lúpulo. Para dolor neuropático, un ratio equilibrado THC:CBD más cariofileno alto es una combinación potente.",
      },
      {
        heading: "Cómo usar los perfiles de terpenos en WeedHub",
        content:
          "En cada página de cepa verás los terpenos dominantes ordenados por porcentaje. El terpeno con mayor presencia es el que más influye en la experiencia. Compara dos cepas con porcentajes similares de THC pero distintos terpenos dominantes — verás diferencias claras en los efectos reportados por la comunidad. También puedes usar el filtro 'Terpeno dominante' en el directorio para encontrar cepas ricas en el terpeno que buscas.",
      },
    ],
  },
  {
    slug: "efecto-sequito",
    title: "El efecto séquito: cómo trabajan juntos los cannabinoides y terpenos",
    kicker: "Ciencia",
    readTime: "8 min",
    description:
      "El cannabis no es solo THC. La interacción entre cannabinoides, terpenos y flavonoides produce efectos que ningún compuesto puede lograr solo. Esto es el efecto séquito.",
    body: [
      {
        heading: "El origen del concepto",
        content:
          "En 1998, los investigadores Raphael Mechoulam y Shimon Ben-Shabat publicaron la hipótesis del efecto séquito (entourage effect): los fitocannabinoides no actúan de forma aislada sino en conjunto, potenciándose o modulándose mutuamente. La analogía musical es útil: el THC solo es una nota; el cannabis completo es una orquesta. Esta idea transformó cómo la ciencia entiende el cannabis y por qué los extractos de espectro completo (full spectrum) producen efectos distintos al THC aislado.",
      },
      {
        heading: "THC + CBD: la dupla más estudiada",
        content:
          "El CBD modifica directamente la experiencia del THC de varias formas: reduce la ansiedad inducida por dosis altas de THC al actuar sobre receptores de serotonina 5-HT1A; prolonga ciertos efectos terapéuticos; y puede reducir la taquicardia. Estudios clínicos muestran que pacientes que usan cannabis con ratio equilibrado THC:CBD reportan menos efectos adversos que quienes usan THC solo. Por eso muchos cultivadores modernos trabajan con ratios 1:1 o 2:1 THC:CBD para usos terapéuticos.",
      },
      {
        heading: "Terpenos que amplifican o suavizan el THC",
        content:
          "El mirceno aumenta la permeabilidad de la barrera hematoencefálica — esto significa que el THC llega al cerebro más rápido y en mayor cantidad cuando el mirceno está presente. El limoneno puede reducir la ansiedad inducida por THC actuando sobre receptores de dopamina y serotonina. El pineno contrarresta la pérdida de memoria a corto plazo que puede causar el THC al inhibir la acetilcolinesterasa. El cariofileno activa receptores CB2 (antiinflamatorios) sin el componente psicoactivo del THC.",
      },
      {
        heading: "Espectro completo vs. aislado: qué dice la evidencia",
        content:
          "Un estudio de 2018 publicado en Frontiers in Plant Science comparó aceite de CBD de espectro completo con CBD aislado en modelos de epilepsia. El aceite de espectro completo fue efectivo en un rango de dosis más amplio y con menos efectos secundarios. Estudios de dolor crónico muestran resultados similares. Sin embargo, el efecto séquito es difícil de aislar experimentalmente y muchos estudios son en modelos animales o in vitro. La evidencia es prometedora pero la ciencia aún está construyendo el mapa completo.",
      },
      {
        heading: "Implicaciones prácticas para elegir tu cannabis",
        content:
          "Para aprovechar el efecto séquito: prefiere flores o extractos de espectro completo sobre destilados de THC aislado. Busca cepas con perfiles de terpenos ricos y variados, no solo alto THC. Conserva bien tu cannabis — los terpenos se evaporan con el calor y el tiempo, y sin ellos pierdes parte del séquito. Lee las reseñas de la comunidad en WeedHub: los efectos reportados reflejan la experiencia completa de la planta, no solo su potencia.",
      },
    ],
  },
  {
    slug: "cultivo-basico",
    title: "Introducción al autocultivo de cannabis",
    kicker: "Cultivo",
    readTime: "9 min",
    description:
      "Cultivar tu propio cannabis te da control total sobre la genética, los insumos y la calidad final. Esta guía cubre lo esencial para empezar: etapas del ciclo, luz, sustrato y primeros pasos.",
    body: [
      {
        heading: "¿Es el autocultivo para ti?",
        content:
          "Antes de invertir en equipo, considera: el cultivo requiere tiempo diario (15–30 minutos mínimo), espacio dedicado (incluso un armario pequeño sirve), presupuesto inicial para equipo básico, y discreción según tu contexto legal. En México y otros países de Latinoamérica, el autocultivo para consumo personal existe en una zona gris legal — infórmate sobre la normativa vigente en tu estado o país antes de empezar. Dicho esto, cultivar cannabis es una experiencia educativa y satisfactoria que te conecta con la planta de una forma que ningún producto comprado puede replicar.",
      },
      {
        heading: "El ciclo de vida de la planta",
        content:
          "La planta de cannabis atraviesa cuatro etapas. Germinación (3–10 días): la semilla se activa con humedad y temperatura cálida (22–26°C). Plántula (2–3 semanas): aparecen los primeros pares de hojas; la planta es frágil y necesita luz suave, mucha humedad y poco o nada de nutrientes. Vegetativa (4–8 semanas): crecimiento rápido de estructura; necesita luz de 18 horas al día, riego regular y nutrientes nitrogenados. Floración (8–12 semanas según genética): con 12 horas de luz y 12 de oscuridad la planta produce flores; cambia la nutrición a fósforo y potasio.",
      },
      {
        heading: "Tierra, coco e hidropónico: elige tu medio",
        content:
          "Para empezar, tierra es el medio más perdonador: amortigua los errores de riego y nutrición, tiene microbioma propio que ayuda a la planta, y requiere menos inversión en equipo. Usa tierra específica para cannabis o una mezcla de tierra de jardín con perlita al 30% para mejorar el drenaje. El coco (fibra de coco) es más técnico pero da resultados más rápidos — requiere riego más frecuente y control preciso de nutrientes. Hidropónico (raíces en agua) da el crecimiento más rápido pero necesita mayor inversión y conocimiento.",
      },
      {
        heading: "La luz: el factor más crítico",
        content:
          "En interior, la luz es tu sol artificial — y es la inversión más importante. Para un cultivo pequeño (1–4 plantas): LEDs de espectro completo entre 200 y 400 watts son la opción más eficiente actualmente. Generan poco calor y consumen menos electricidad que los HPS tradicionales. La distancia a la luz importa: muy cerca quema las hojas, muy lejos estira la planta. Cada fabricante da rangos específicos. Para exterior, la luz solar es gratuita y potente — el reto es el fotoperiodo natural, que determina cuándo florece la planta según la latitud.",
      },
      {
        heading: "Errores comunes del cultivador principiante",
        content:
          "Regar en exceso: es la causa número uno de problemas — el cannabis prefiere ciclos de humedad y secado. Riega cuando los primeros 2–3 cm de tierra estén secos. Exceso de nutrientes: más no es mejor; las quemaduras por nutrientes son frecuentes en principiantes. Empieza con la mitad de la dosis recomendada. Ignorar el pH: el cannabis absorbe nutrientes en un rango de pH entre 6.0 y 7.0 en tierra, 5.5–6.5 en coco/hidro. Agua de grifo no ajustada puede bloquear la absorción. Cosechar demasiado pronto: espera a que los tricomas pasen de transparente a lechoso/ámbar — compra una lupa de 30–60x para verificarlo.",
      },
    ],
  },
];
