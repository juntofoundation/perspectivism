import type Address from '../../acai/Address'
import type Agent from '../../acai/Agent'
import type Language from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type { Interaction } from '../../acai/Language'
import { JuntoChannelAdapter } from './linksAdapter'
import { JuntoSettingsUI } from './settingsUI'

function interactions(a: Agent, expression: Address): Interaction[] {
    return []
}

export const name: string = "junto-channel"

export default function create(context: LanguageContext): Language {
    const linksAdapter = new JuntoChannelAdapter(context)
    const settingsUI = new JuntoSettingsUI()

    return {
        name,
        linksAdapter,
        settingsUI,
        interactions,
    } as Language
}

