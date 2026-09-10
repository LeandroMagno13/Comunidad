import type { Metadata } from 'next';
import Section from '../../src/components/ui/Section';
import KeyPhrase from '../../src/components/ui/KeyPhrase';

export const metadata: Metadata = {
  title: 'Principios | Comunidad Post Singularidad',
  description:
    'Los principios de Comunidad Post Singularidad: pluralidad, autonomía, voluntariedad y libertad de experimentación. No partimos de una ideología. Partimos de una pregunta.',
  alternates: {
    canonical: '/principios',
  },
  openGraph: {
    title: 'Principios | Comunidad Post Singularidad',
    description:
      'Comunidad Post Singularidad no pretende imponer una forma de vida ni una ideología económica. Conocé los principios que enmarcan el proyecto.',
    url: 'https://comunidad-i86g.vercel.app/principios',
    siteName: 'Comunidad Post Singularidad',
    locale: 'es_AR',
    type: 'website',
  },
};

function PrincipleBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-4 text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

export default function PrincipiosPage() {
  return (
    <div className="bg-white">
      <Section background="dark">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm uppercase tracking-wider text-blue-300 font-semibold mb-3">
            Marco de lectura del proyecto
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-8">Principios</h1>
          <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-10">
            Comunidad Post Singularidad no parte de una ideología económica determinada. Parte de
            una pregunta: ¿cómo podemos ampliar la autonomía de las personas frente a una economía
            en la que el trabajo humano podría dejar de ser el principal mecanismo de acceso a los
            recursos?
          </p>
          <KeyPhrase
            text="No partimos de una ideología. Partimos de una pregunta."
            className="text-blue-300 text-2xl sm:text-3xl"
          />
          <p className="text-sm text-gray-400 mt-6">
            Estos principios no definen cómo vivir. Definen las condiciones para que personas
            diferentes puedan convivir, colaborar y experimentar sin imponer una forma de vida.
          </p>
        </div>
      </Section>

      <Section>
        <div className="max-w-3xl mx-auto space-y-6">
          <PrincipleBlock title="Pluralidad y autonomía">
            <P>
              Comunidad Post Singularidad no pretende establecer una forma correcta de vivir,
              pensar o sentir.
            </P>
            <P>
              La participación en la comunidad es voluntaria y no implica renunciar a la propiedad
              privada, al proyecto de vida personal ni a las actividades que cada persona desarrolle
              fuera de ella.
            </P>
            <P>
              Cada miembro conserva su patrimonio y su autonomía, salvo aquello que voluntariamente
              decida aportar, compartir o poner bajo reglas comunitarias.
            </P>
            <P>
              Tampoco pretendemos imponer una única visión económica. Dentro de la comunidad pueden
              existir personas con ideas muy diferentes. Un gremio puede experimentar con
              cooperativismo, otro con modelos de propiedad privada, otro con sistemas comunitarios
              o cualquier otra propuesta que sus integrantes quieran estudiar o desarrollar. Incluso
              pueden existir propuestas con las que la mayoría de la comunidad no esté de acuerdo.
            </P>
            <P>
              La pluralidad de los gremios no obliga a la comunidad a adoptar sus modelos. El
              propósito de la comunidad es crear un espacio donde esas diferencias puedan coexistir
              y donde distintas ideas puedan ser discutidas, investigadas y, cuando sea posible,
              experimentadas voluntariamente.
            </P>
            <P>
              No queremos decirle a nadie cómo tiene que vivir, qué tiene que pensar o qué tiene que
              sentir. Queremos establecer únicamente las condiciones necesarias para que las
              personas puedan convivir y colaborar respetando los derechos de los demás y los
              acuerdos que hayan aceptado.
            </P>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-5">
              <p className="text-gray-900 font-semibold mb-2">Nuestro punto de partida es simple:</p>
              <p className="text-lg font-bold text-blue-800">
                Todo está permitido excepto aquello que esté legítimamente prohibido.
              </p>
              <p className="text-sm text-gray-600 mt-3">
                No partimos de una lista de conductas permitidas que determine de antemano cómo debe
                ser la vida de sus miembros. Esa libertad no autoriza vulnerar derechos, incumplir
                la ley aplicable ni romper los acuerdos que cada persona haya aceptado
                voluntariamente.
              </p>
            </div>
            <P>
              Las reglas pueden cambiar si la comunidad considera que deben cambiar. Si en algún
              momento una regla, estructura o principio deja de servir al propósito de la comunidad,
              también debe poder ser cuestionado.
            </P>
          </PrincipleBlock>
        </div>
      </Section>

      <Section background="gray">
        <div className="max-w-3xl mx-auto space-y-6">
          <PrincipleBlock title="Voluntariedad">
            <P>La participación en Comunidad Post Singularidad debe ser voluntaria.</P>
            <P>Participar no implica:</P>
            <ul className="grid gap-2 sm:grid-cols-2 text-sm sm:text-base">
              {[
                'adoptar una ideología',
                'abandonar otras actividades',
                'entregar patrimonio personal',
                'renunciar a la propiedad privada',
                'abandonar un proyecto personal',
                'compartir todos los bienes',
                'trabajar para la comunidad',
                'aceptar una determinada forma de vida',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <P>
              Las personas pueden participar en aquello que quieran participar y mantener
              completamente independientes sus actividades y proyectos externos.
            </P>
            <P>
              Se trata del principio organizativo de la comunidad, no de una promesa jurídica
              absoluta: cualquier participación concreta estará sujeta a los acuerdos
              correspondientes.
            </P>
          </PrincipleBlock>
        </div>
      </Section>

      <Section>
        <div className="max-w-3xl mx-auto space-y-6">
          <PrincipleBlock title="Propiedad independiente">
            <P>
              La existencia de un patrimonio común dentro del proyecto no implica que todo
              patrimonio de los miembros deba convertirse en patrimonio común. La propiedad personal
              y el patrimonio comunitario deben mantenerse conceptualmente separados.
            </P>
            <P>
              Una persona puede participar en la comunidad sin aportar patrimonio. Otra puede
              aportar recursos. Otra puede aportar conocimiento. Otra puede aportar trabajo. Otra
              puede simplemente participar de las discusiones.
            </P>
            <P>
              Las distintas formas de participación no deben interpretarse automáticamente como
              transferencia de propiedad.
            </P>
          </PrincipleBlock>
        </div>
      </Section>

      <Section background="gray">
        <div className="max-w-3xl mx-auto space-y-6">
          <PrincipleBlock title="Libertad de experimentación">
            <P>Los gremios son espacios para experimentar.</P>
            <P>
              No existe una única forma correcta de organizar una actividad humana. Por eso,
              distintos grupos pueden explorar modelos diferentes siempre que sus integrantes
              participen voluntariamente y respeten los límites comunes.
            </P>
            <div className="grid gap-2 sm:grid-cols-2 text-sm sm:text-base">
              {[
                'Un gremio podría estudiar cooperativas.',
                'Otro podría estudiar empresas tradicionales.',
                'Otro podría experimentar con propiedad comunitaria.',
                'Otro podría investigar sistemas de intercambio.',
                'Otro podría investigar modelos completamente diferentes.',
              ].map((item) => (
                <p key={item} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{item}</span>
                </p>
              ))}
            </div>
            <P>
              La existencia de un experimento dentro de un gremio no convierte automáticamente ese
              modelo en el modelo oficial de toda la comunidad. La comunidad debe funcionar como un
              espacio donde las ideas puedan ser probadas, comparadas y cuestionadas.
            </P>
          </PrincipleBlock>
        </div>
      </Section>

      <Section>
        <div className="max-w-3xl mx-auto space-y-6">
          <PrincipleBlock title="Derechos y límites">
            <P>La libertad de experimentación tiene límites.</P>
            <P>
              La comunidad debe proteger los derechos fundamentales de sus participantes y evitar la
              coerción, el fraude, la violencia, el abuso y cualquier mecanismo mediante el cual una
              persona pueda imponer arbitrariamente su voluntad sobre otra.
            </P>
            <P>
              Los acuerdos voluntarios deben ser respetados mientras continúen siendo válidos. Las
              reglas comunes existen para hacer posible la convivencia y la colaboración, no para
              definir cómo debe vivir cada persona.
            </P>
            <P>
              No se trata de establecer aquí una lista exhaustiva de prohibiciones. El objetivo es
              establecer el principio general, no crear un código penal interno.
            </P>
          </PrincipleBlock>
        </div>
      </Section>

      <Section background="gray">
        <div className="max-w-3xl mx-auto space-y-6">
          <PrincipleBlock title="Hipótesis, no dogma">
            <P>Las ideas de Comunidad Post Singularidad son hipótesis de trabajo.</P>
            <P>
              No asumimos que una propuesta es correcta simplemente porque forme parte del proyecto.
              Una idea puede ser cuestionada. Un modelo puede ser reemplazado. Una estructura puede
              ser abandonada. Una hipótesis puede resultar falsa. La comunidad debe poder
              reconocerlo.
            </P>
            <P>
              El proyecto debe valorar más la capacidad de descubrir que algo no funciona que la
              necesidad de demostrar que una idea inicial era correcta.
            </P>
          </PrincipleBlock>
        </div>
      </Section>

      <Section>
        <div className="max-w-3xl mx-auto space-y-6">
          <PrincipleBlock title="Experimento, no doctrina">
            <P>
              El objetivo no es construir una doctrina económica y convencer a todos de adoptarla.
              El objetivo es investigar si determinadas formas de organización, propiedad y
              cooperación pueden resolver problemas reales.
            </P>
            <P>
              Por eso queremos experimentar en pequeña escala antes de afirmar que algo funciona. Las
              decisiones deberían basarse, en la medida de lo posible, en resultados observables y
              experiencia acumulada.
            </P>
            <P>
              Una propuesta que funciona debe poder fortalecerse. Una propuesta que no funciona debe
              poder modificarse o abandonarse.
            </P>
          </PrincipleBlock>
        </div>
      </Section>

      <Section background="dark">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm uppercase tracking-wider text-blue-300 font-semibold mb-3">
            Una comunidad, no una forma de vida
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-8">Una comunidad, no una forma de vida</h2>
          <div className="text-left space-y-4 text-gray-300 leading-relaxed mb-8">
            <P>
              Comunidad Post Singularidad puede tener un propósito común sin convertirse en un
              proyecto que determine cómo deben vivir sus integrantes.
            </P>
            <P>
              Una persona puede participar y mantener una vida completamente individual. Otra puede
              formar un gremio cooperativo. Otra puede crear una empresa privada. Otra puede vivir en
              una comunidad donde sus integrantes compartan prácticamente todo. Otra puede defender
              ideas liberales, socialistas, libertarias, conservadoras, religiosas o ninguna de
              ellas.
            </P>
            <P>
              La comunidad no necesita resolver esas diferencias para existir. Necesita establecer
              las condiciones para que personas diferentes puedan colaborar voluntariamente alrededor
              de objetivos concretos.
            </P>
          </div>
          <KeyPhrase
            text="No buscamos una única manera de vivir. Buscamos un espacio donde diferentes maneras de vivir puedan coexistir."
            className="text-blue-300 text-2xl sm:text-3xl"
          />
        </div>
      </Section>
    </div>
  );
}