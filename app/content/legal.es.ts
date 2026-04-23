/**
 * Legal content for WeedHub.
 *
 * These are scaffold templates. Replace every [PLACEHOLDER] with real data
 * before relaunch. Reviewed by a lawyer licensed in your jurisdiction is
 * strongly recommended — especially around user-generated content and
 * age-restricted material.
 */

export const LEGAL_COMPANY = {
  name: "[NOMBRE LEGAL DE LA EMPRESA]",
  country: "[PAÍS / JURISDICCIÓN]",
  contactEmail: "[legal@weedhub.info]",
  lastUpdated: "2026-04-19",
};

export interface LegalSection {
  heading: string;
  body: string;
}

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: "1. Qué es WeedHub",
    body:
      "WeedHub es una plataforma editorial y de comunidad para la discusión informada del cannabis en español. Ofrecemos un directorio de cepas, reseñas contextuales escritas por usuarios y contenido editorial. No vendemos, distribuimos ni facilitamos la compra de cannabis ni de ningún producto relacionado.",
  },
  {
    heading: "2. Mayoría de edad y consumo responsable",
    body:
      "Para crear una cuenta debes tener al menos 18 años (o la mayoría de edad aplicable en tu jurisdicción, lo que sea mayor). WeedHub no promueve el consumo. La información publicada es con fines educativos y de comunidad — no sustituye el consejo médico, legal ni profesional.",
  },
  {
    heading: "3. Tu cuenta",
    body:
      "Eres responsable de mantener la seguridad de tu cuenta y de todas las actividades que ocurran bajo ella. Notifícanos inmediatamente si sospechas acceso no autorizado. Podemos suspender o eliminar cuentas que violen estos términos, especialmente en casos de acoso, spam o suplantación.",
  },
  {
    heading: "4. Contenido generado por usuarios",
    body:
      "Cuando publicas una reseña, comentario o foto en WeedHub, nos otorgas una licencia no exclusiva, mundial y libre de regalías para mostrarla, reproducirla y distribuirla dentro del servicio. Tú sigues siendo el titular de tus derechos. Puedes solicitar la eliminación en cualquier momento desde tu perfil.",
  },
  {
    heading: "5. Lo que no está permitido",
    body:
      "Prohibimos explícitamente: contenido que facilite la venta de sustancias controladas; reseñas pagadas sin divulgación; lenguaje de odio, acoso o amenazas; contenido sobre menores consumiendo; suplantación; ingeniería inversa o scraping automatizado sin autorización.",
  },
  {
    heading: "6. Moderación",
    body:
      "Revisamos reseñas marcadas por la comunidad. Podemos remover contenido que viole estos términos sin previo aviso. Si crees que una remoción fue errónea, escríbenos a " +
      LEGAL_COMPANY.contactEmail +
      ".",
  },
  {
    heading: "7. Disponibilidad del servicio",
    body:
      "Hacemos esfuerzos razonables para mantener WeedHub disponible, pero no garantizamos servicio ininterrumpido. Podemos modificar o descontinuar funciones con aviso razonable.",
  },
  {
    heading: "8. Propiedad intelectual",
    body:
      "El diseño, marca, tokens visuales y código propio de WeedHub son propiedad de " +
      LEGAL_COMPANY.name +
      ". Los nombres de cepas de uso común (Blue Dream, OG Kush, etc.) se documentan con fines informativos; no implican endoso de ningún productor.",
  },
  {
    heading: "9. Limitación de responsabilidad",
    body:
      "En la máxima medida permitida por la ley, WeedHub no es responsable por daños indirectos derivados del uso de la información publicada. Consulta siempre a un profesional antes de tomar decisiones de salud.",
  },
  {
    heading: "10. Cambios en estos términos",
    body:
      "Podemos actualizar estos términos. Cuando los cambios sean materiales, te avisaremos por correo o dentro de la plataforma con al menos 15 días de anticipación. Si continúas usando WeedHub después de la fecha efectiva, aceptas los nuevos términos.",
  },
  {
    heading: "11. Jurisdicción",
    body:
      "Estos términos se rigen por las leyes de " +
      LEGAL_COMPANY.country +
      ". Cualquier disputa se resolverá en los tribunales competentes de esa jurisdicción.",
  },
  {
    heading: "12. Contacto",
    body:
      "Escríbenos a " +
      LEGAL_COMPANY.contactEmail +
      " para cualquier pregunta sobre estos términos.",
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: "1. Qué datos recogemos",
    body:
      "Al crear una cuenta: correo electrónico y nombre público. Al usar el servicio: tus reseñas, cepas guardadas, votos útiles y preferencias cannábicas que tú eliges compartir (nivel de experiencia, efectos preferidos, método). Técnicos: dirección IP, tipo de navegador, fecha y hora de las visitas, en logs de servidor conservados por 30 días.",
  },
  {
    heading: "2. Para qué los usamos",
    body:
      "Para operar el servicio (autenticarte, mostrarte contenido relevante, calcular tus insignias), para comunicarnos contigo (avisos de seguridad, cambios en el servicio) y para mejorar WeedHub (analíticas agregadas sin identificarte). No vendemos tus datos a terceros.",
  },
  {
    heading: "3. Bases legales (cuando aplique)",
    body:
      "Procesamos tus datos con base en: (a) la ejecución del contrato que aceptas al usar el servicio, (b) tu consentimiento explícito para el boletín y cookies opcionales, y (c) interés legítimo en mantener la seguridad del servicio y prevenir abuso.",
  },
  {
    heading: "4. Con quién compartimos datos",
    body:
      "Proveedores de infraestructura que operan bajo acuerdos de procesamiento de datos: MongoDB Atlas (base de datos), Cloudinary (imágenes), Resend (correo transaccional y newsletter). No compartimos tus datos con anunciantes ni con brokers de datos.",
  },
  {
    heading: "5. Cookies y tecnologías similares",
    body:
      "Usamos una cookie de sesión (__weedhub_session) para mantenerte conectado y una cookie de preferencia (wh:theme) para recordar tu tema. Ninguna es de publicidad. Si en el futuro añadimos analíticas, pediremos tu consentimiento previo.",
  },
  {
    heading: "6. Tus derechos",
    body:
      "Puedes acceder, rectificar o eliminar tus datos en cualquier momento desde tu perfil, o escribiéndonos a " +
      LEGAL_COMPANY.contactEmail +
      ". Si resides en la UE, Reino Unido, México u otra jurisdicción con protecciones específicas, tienes además derecho a la portabilidad, oposición y a presentar una queja ante tu autoridad de protección de datos.",
  },
  {
    heading: "7. Retención",
    body:
      "Mantenemos tus datos de cuenta mientras tu cuenta exista. Al eliminar tu cuenta, borramos información identificable en un plazo de 30 días, salvo lo que debamos conservar por obligación legal o para resolver disputas. Las reseñas publicadas pueden permanecer de forma anonimizada.",
  },
  {
    heading: "8. Menores",
    body:
      "WeedHub es para personas mayores de edad. No recogemos deliberadamente datos de menores. Si descubrimos que un menor ha creado una cuenta, la eliminaremos.",
  },
  {
    heading: "9. Transferencias internacionales",
    body:
      "Tus datos pueden procesarse fuera de tu país de residencia (por ejemplo, servidores en EE.UU. o Europa). Usamos cláusulas contractuales estándar y proveedores con certificaciones reconocidas para proteger esas transferencias.",
  },
  {
    heading: "10. Cambios en esta política",
    body:
      "Publicaremos cualquier actualización en esta página y, si los cambios son materiales, te avisaremos con al menos 15 días de antelación.",
  },
  {
    heading: "11. Contacto",
    body:
      "Para ejercer cualquier derecho o pregunta: " +
      LEGAL_COMPANY.contactEmail +
      ". Respondemos en un plazo máximo de 15 días hábiles.",
  },
];
