/**
 * Brazilian Portuguese legal draft. AI-assisted.
 * TODO(legal-pt): Lawyer review for Brazilian jurisdiction. LGPD requirements
 * may need expanded Privacy section. Cannabis regulation differs from MX.
 */
import { LEGAL_COMPANY, type LegalSection } from "./legal.es";

export { LEGAL_COMPANY };

export const TERMS_SECTIONS_PT: LegalSection[] = [
  {
    heading: "1. O que é o WeedHub",
    body:
      "WeedHub é uma plataforma editorial e de comunidade para discussão informada sobre cannabis. Oferecemos um diretório de variedades, avaliações contextuais escritas por usuários e conteúdo editorial. Não vendemos, distribuímos nem facilitamos a compra de cannabis ou produtos relacionados.",
  },
  {
    heading: "2. Maioridade e consumo responsável",
    body:
      "Para criar uma conta você deve ter pelo menos 18 anos (ou a maioridade aplicável na sua jurisdição, o que for maior). O WeedHub não promove o consumo. A informação publicada é com fins educativos e comunitários — não substitui aconselhamento médico, jurídico ou profissional.",
  },
  {
    heading: "3. Sua conta",
    body:
      "Você é responsável por manter a segurança da sua conta e por todas as atividades realizadas nela. Notifique-nos imediatamente se suspeitar de acesso não autorizado. Podemos suspender ou remover contas que violem estes termos, especialmente em casos de assédio, spam ou falsidade ideológica.",
  },
  {
    heading: "4. Conteúdo gerado por usuários",
    body:
      "Quando você publica uma avaliação, comentário ou foto no WeedHub, você nos concede uma licença não exclusiva, mundial e gratuita para exibi-la, reproduzi-la e distribuí-la dentro do serviço. Você continua sendo titular dos seus direitos. Pode solicitar remoção a qualquer momento no seu perfil.",
  },
  {
    heading: "5. O que não é permitido",
    body:
      "Proibimos explicitamente: conteúdo que facilite a venda de substâncias controladas; avaliações pagas sem divulgação; discurso de ódio, assédio ou ameaças; conteúdo sobre menores consumindo; falsidade ideológica; engenharia reversa ou scraping automatizado sem autorização.",
  },
  {
    heading: "6. Moderação",
    body:
      "Revisamos avaliações sinalizadas pela comunidade. Podemos remover conteúdo que viole estes termos sem aviso prévio. Se acha que a remoção foi indevida, escreva para " +
      LEGAL_COMPANY.contactEmail +
      ".",
  },
  {
    heading: "7. Disponibilidade do serviço",
    body:
      "Fazemos esforços razoáveis para manter o WeedHub disponível, mas não garantimos serviço ininterrupto. Podemos modificar ou descontinuar funções com aviso razoável.",
  },
  {
    heading: "8. Propriedade intelectual",
    body:
      "O design, marca, tokens visuais e código próprio do WeedHub são propriedade de " +
      LEGAL_COMPANY.name +
      ". Os nomes de variedades de uso comum (Blue Dream, OG Kush, etc.) são documentados para fins informativos; não implicam endosso de nenhum produtor.",
  },
  {
    heading: "9. Limitação de responsabilidade",
    body:
      "Na máxima extensão permitida por lei, o WeedHub não é responsável por danos indiretos decorrentes do uso da informação publicada. Consulte sempre um profissional antes de tomar decisões de saúde.",
  },
  {
    heading: "10. Alterações nestes termos",
    body:
      "Podemos atualizar estes termos. Quando as alterações forem materiais, avisaremos por e-mail ou dentro da plataforma com ao menos 15 dias de antecedência. Se continuar usando o WeedHub após a data efetiva, aceita os novos termos.",
  },
  {
    heading: "11. Jurisdição",
    body:
      "Estes termos regem-se pelas leis de " +
      LEGAL_COMPANY.country +
      ". Qualquer disputa será resolvida nos tribunais competentes dessa jurisdição.",
  },
  {
    heading: "12. Contato",
    body:
      "Escreva para " +
      LEGAL_COMPANY.contactEmail +
      " para qualquer pergunta sobre estes termos.",
  },
];

export const PRIVACY_SECTIONS_PT: LegalSection[] = [
  {
    heading: "1. Quais dados coletamos",
    body:
      "Ao criar conta: e-mail e nome público. Ao usar o serviço: suas avaliações, variedades salvas, votos úteis e preferências que você escolhe compartilhar (nível de experiência, efeitos preferidos, método). Técnicos: endereço IP, tipo de navegador, data e hora das visitas, em logs de servidor por 30 dias.",
  },
  {
    heading: "2. Para que usamos",
    body:
      "Para operar o serviço (autenticar, mostrar conteúdo relevante, calcular suas insígnias), nos comunicarmos com você (avisos de segurança, alterações no serviço) e melhorar o WeedHub (análises agregadas sem identificá-lo). Não vendemos seus dados a terceiros.",
  },
  {
    heading: "3. Bases legais (quando aplicável)",
    body:
      "Processamos seus dados com base em: (a) execução do contrato que você aceita ao usar o serviço, (b) consentimento explícito para newsletter e cookies opcionais, e (c) interesse legítimo em manter a segurança do serviço e prevenir abuso. Para usuários no Brasil, aplicam-se os fundamentos da LGPD.",
  },
  {
    heading: "4. Com quem compartilhamos dados",
    body:
      "Provedores de infraestrutura sob acordos de processamento de dados: MongoDB Atlas (banco de dados), Cloudinary (imagens), Resend (e-mail transacional e newsletter). Não compartilhamos seus dados com anunciantes nem com data brokers.",
  },
  {
    heading: "5. Cookies e tecnologias similares",
    body:
      "Usamos um cookie de sessão (__weedhub_session) para manter você logado e um cookie de preferência (wh:theme) para lembrar seu tema. Nenhum é de publicidade. Se no futuro adicionarmos análises, pediremos seu consentimento prévio.",
  },
  {
    heading: "6. Seus direitos",
    body:
      "Você pode acessar, retificar ou excluir seus dados a qualquer momento no seu perfil, ou escrevendo para " +
      LEGAL_COMPANY.contactEmail +
      ". Se reside no Brasil (LGPD), UE/UK (GDPR), México ou outra jurisdição com proteções específicas, tem também direito à portabilidade, oposição e a apresentar queixa à autoridade de proteção de dados.",
  },
  {
    heading: "7. Retenção",
    body:
      "Mantemos seus dados de conta enquanto sua conta existir. Ao excluir sua conta, apagamos informações identificáveis em até 30 dias, exceto o que devemos conservar por obrigação legal ou para resolver disputas. As avaliações publicadas podem permanecer de forma anonimizada.",
  },
  {
    heading: "8. Menores",
    body:
      "O WeedHub é para maiores de idade. Não coletamos deliberadamente dados de menores. Se descobrirmos que um menor criou conta, ela será removida.",
  },
  {
    heading: "9. Transferências internacionais",
    body:
      "Seus dados podem ser processados fora do seu país de residência (por exemplo, servidores nos EUA ou Europa). Usamos cláusulas contratuais padrão e provedores com certificações reconhecidas para proteger essas transferências.",
  },
  {
    heading: "10. Alterações nesta política",
    body:
      "Publicaremos qualquer atualização nesta página e, se as alterações forem materiais, avisaremos com ao menos 15 dias de antecedência.",
  },
  {
    heading: "11. Contato",
    body:
      "Para exercer qualquer direito ou dúvida: " +
      LEGAL_COMPANY.contactEmail +
      ". Respondemos em até 15 dias úteis.",
  },
];
