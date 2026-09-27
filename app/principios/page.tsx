import type { Metadata } from 'next';

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
    url: 'https://www.postsingular.org/principios',
    siteName: 'Comunidad Post Singularidad',
    locale: 'es_AR',
    type: 'website',
  },
};

function Block({
  id,
  title,
  emoji,
  children,
}: {
  id?: string;
  title: string;
  emoji?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24 rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        {emoji && <span className="mr-2">{emoji}</span>}
        {title}
      </h2>
      <div className="space-y-4 text-gray-700 leading-relaxed text-sm sm:text-base">{children}</div>
    </div>
  );
}

export default function PrincipiosPage() {
  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl space-y-6 px-4">
        {/* Header */}
        <header className="rounded-xl bg-slate-900 p-8 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-300">
            Marco de lectura del proyecto
          </p>
          <h1 className="mt-2 text-3xl font-bold">Principios</h1>
          <p className="mt-4 text-sm text-slate-300">
            Estos principios no definen cómo vivir. Definen las condiciones para que personas
            diferentes puedan convivir, colaborar y experimentar sin imponer una forma de vida.
          </p>
          <p className="mt-3 text-sm text-slate-400">
            No partimos de una ideología. Partimos de una pregunta.
          </p>
        </header>

        {/* Tabla de contenidos */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">¿Qué querés leer?</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <a href="#pluralidad" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">Pluralidad y autonomía</a>
            <a href="#voluntariedad" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">Voluntariedad</a>
            <a href="#propiedad" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">Propiedad independiente</a>
            <a href="#experimentacion" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">Libertad de experimentación</a>
            <a href="#limites" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">Derechos y límites</a>
            <a href="#hipotesis" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">Hipótesis, no dogma</a>
          </div>
        </div>

        {/* PLURALIDAD */}
        <Block id="pluralidad" title="Pluralidad y autonomía" emoji="🌍">
          <p>
            Comunidad Post Singularidad no pretende establecer una forma correcta de vivir, pensar o sentir.
          </p>
          <p>
            La participación en la comunidad es voluntaria y no implica renunciar a la propiedad
            privada, al proyecto de vida personal ni a las actividades que cada persona desarrolle
            fuera de ella.
          </p>
          <p>
            Cada miembro conserva su patrimonio y su autonomía, salvo aquello que voluntariamente
            decida aportar, compartir o poner bajo reglas comunitarias.
          </p>
          <p>
            Tampoco pretendemos imponer una única visión económica. Dentro de la comunidad pueden
            existir personas con ideas muy diferentes. Un gremio puede experimentar con
            cooperativismo, otro con modelos de propiedad privada, otro con sistemas comunitarios
            o cualquier otra propuesta que sus integrantes quieran estudiar o desarrollar.
          </p>
          <p>
            No queremos decirle a nadie cómo tiene que vivir, qué tiene que pensar o qué tiene que
            sentir. Queremos establecer únicamente las condiciones necesarias para que las
            personas puedan convivir y colaborar respetando los derechos de los demás y los
            acuerdos que hayan aceptado.
          </p>
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
          <p>
            Las reglas pueden cambiar si la comunidad considera que deben cambiar. Si en algún
            momento una regla, estructura o principio deja de servir al propósito de la comunidad,
            también debe poder ser cuestionado.
          </p>
        </Block>

        {/* VOLUNTARIEDAD */}
        <Block id="voluntariedad" title="Voluntariedad" emoji="🤝">
          <p>La participación en Comunidad Post Singularidad debe ser voluntaria.</p>
          <p>Participar no implica:</p>
          <div className="grid gap-2 sm:grid-cols-2">
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
              <div key={item} className="flex items-start gap-2">
                <span className="text-red-500 mt-1">✕</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p>
            Las personas pueden participar en aquello que quieran participar y mantener
            completamente independientes sus actividades y proyectos externos.
          </p>
          <p>
            Se trata del principio organizativo de la comunidad, no de una promesa jurídica
            absoluta: cualquier participación concreta estará sujeta a los acuerdos
            correspondientes.
          </p>
        </Block>

        {/* PROPIEDAD */}
        <Block id="propiedad" title="Propiedad independiente" emoji="🏠">
          <p>
            La existencia de un patrimonio común dentro del proyecto no implica que todo
            patrimonio de los miembros deba convertirse en patrimonio común. La propiedad personal
            y el patrimonio comunitario deben mantenerse conceptualmente separados. La propiedad
            compartida que investigamos no reemplaza la propiedad individual: puede coexistir con ella.
          </p>
          <p>
            Una persona puede participar en la comunidad sin aportar patrimonio. Otra puede
            aportar recursos. Otra puede aportar conocimiento. Otra puede aportar trabajo. Otra
            puede simplemente participar de las discusiones.
          </p>
          <p>
            Las distintas formas de participación no deben interpretarse automáticamente como
            transferencia de propiedad.
          </p>
        </Block>

        {/* EXPERIMENTACIÓN */}
        <Block id="experimentacion" title="Libertad de experimentación" emoji="🧪">
          <p>Los gremios son espacios para experimentar.</p>
          <p>
            No existe una única forma correcta de organizar una actividad humana. Por eso,
            distintos grupos pueden explorar modelos diferentes siempre que sus integrantes
            participen voluntariamente y respeten los límites comunes.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
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
          <p>
            La existencia de un experimento dentro de un gremio no convierte automáticamente ese
            modelo en el modelo oficial de toda la comunidad. La comunidad debe funcionar como un
            espacio donde las ideas puedan ser probadas, comparadas y cuestionadas.
          </p>
        </Block>

        {/* LÍMITES */}
        <Block id="limites" title="Derechos y límites" emoji="⚖️">
          <p>La libertad de experimentación tiene límites.</p>
          <p>
            La comunidad debe proteger los derechos fundamentales de sus participantes y evitar la
            coerción, el fraude, la violencia, el abuso y cualquier mecanismo mediante el cual una
            persona pueda imponer arbitrariamente su voluntad sobre otra.
          </p>
          <p>
            Los acuerdos voluntarios deben ser respetados mientras continúen siendo válidos. Las
            reglas comunes existen para hacer posible la convivencia y la colaboración, no para
            definir cómo debe vivir cada persona.
          </p>
          <p>
            No se trata de establecer aquí una lista exhaustiva de prohibiciones. El objetivo es
            establecer el principio general, no crear un código penal interno.
          </p>
        </Block>

        {/* HIPÓTESIS */}
        <Block id="hipotesis" title="Hipótesis, no dogma" emoji="🔍">
          <p>Las ideas de Comunidad Post Singularidad son hipótesis de trabajo.</p>
          <p>
            No asumimos que una propuesta es correcta simplemente porque forme parte del proyecto.
            Una idea puede ser cuestionada. Un modelo puede ser reemplazado. Una estructura puede
            ser abandonada. Una hipótesis puede resultar falsa. La comunidad debe poder
            reconocerlo.
          </p>
          <p>
            El proyecto debe valorar más la capacidad de descubrir que algo no funciona que la
            necesidad de demostrar que una idea inicial era correcta.
          </p>
        </Block>

        {/* EXPERIMENTO, NO DOCTRINA */}
        <Block id="experimento" title="Experimento, no doctrina" emoji="🔬">
          <p>
            El objetivo no es construir una doctrina económica y convencer a todos de adoptarla.
            El objetivo es investigar si determinadas formas de organización, propiedad y
            cooperación pueden resolver problemas reales.
          </p>
          <p>
            Por eso queremos experimentar en pequeña escala antes de afirmar que algo funciona. Las
            decisiones deberían basarse, en la medida de lo posible, en resultados observables y
            experiencia acumulada.
          </p>
          <p>
            Una propuesta que funciona debe poder fortalecerse. Una propuesta que no funciona debe
            poder modificarse o abandonarse.
          </p>
        </Block>

        {/* CIERRE */}
        <div className="rounded-xl bg-slate-900 p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-6">Una comunidad, no una forma de vida</h2>
          <div className="text-left space-y-4 text-gray-300 leading-relaxed mb-8">
            <p>
              Comunidad Post Singularidad puede tener un propósito común sin convertirse en un
              proyecto que determine cómo deben vivir sus integrantes.
            </p>
            <p>
              Una persona puede participar y mantener una vida completamente individual. Otra puede
              formar un gremio cooperativo. Otra puede crear una empresa privada. Otra puede vivir en
              una comunidad donde sus integrantes compartan prácticamente todo. Otra puede defender
              ideas liberales, socialistas, libertarias, conservadoras, religiosas o ninguna de
              ellas.
            </p>
            <p>
              La comunidad no necesita resolver esas diferencias para existir. Necesita establecer
              las condiciones para que personas diferentes puedan colaborar voluntariamente alrededor
              de objetivos concretos.
            </p>
          </div>
          <p className="text-2xl font-bold text-sky-300">
            No buscamos una única manera de vivir. Buscamos un espacio donde diferentes maneras de vivir puedan coexistir.
          </p>
        </div>
      </div>
    </main>
  );
}
