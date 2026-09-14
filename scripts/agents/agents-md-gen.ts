<?DSML?tool_calls>
<?DSML?invoke name="bash">
<?DSML?parameter name="command" string="true">$git255 = @'
import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// RONDA G - sec 3: GENERADOR DE AGENTS.md (contrato publico para agentes
// externos) y de la evidencia JSON standalone, byte-safe (ASCII puro).
//
// AGENTS.md es el CONTRATO PUBLICO de esta comunidad para CUALQUIER agente
// externo (IA automatizada, integrante de la membrana, operador 24/7, futuro
// bot de Telegram): le dice exactamente que puede hacer, como, donde, con
// que limites y que conducta se espera de el. Es DISPOSITIVO: si no esta,
// ningun agente externo sabe descubrir la comunidad ni como autenticarse.
//
// CREDO (Lee.txt RONDA G sec 3, explicito):
//   - Es publico: cualquier agente externo autorizado lo lee para operar.
//   - No contiene secretos: ni tokens, ni credenciales, ni rutas de archivo de
//     evidencia con datos personales. Los secretos SIEMPRE por ENV/secret del
//     propio agente (AGENT_SUPER_ADMIN_INTERNAL_TOKEN, AGENT_TOKEN_SECRET,
//     AGENT_SUPER_ADMIN_INTERNAL_SECRET), nunca en el contrato.
//   - No describe la puerta trasera del agente interno 24/7 (sec 2): el
//     contrato publico muestra SOLO lo que la membrana autoriza a un agente
//     EXTERNAL (dueno humano / operador manual autorizado) y lo que la API
//     publica expone. La identidad interna INTERNAL/SuperAdmin se documenta
//     como articulo separado NO PUBLICO (archivo adjunto aparte del contrato).
//
// Evidencia standalone determinista:
//   evidence/agentes/membrana/agents-md.json
// =============================================================================
import {
  AGENTS_MD_ESCOPE,
  AgentStore,
} from '../src/lib/agents/internal-super-admin'; // no; contrato publico NO importa secretos internos
