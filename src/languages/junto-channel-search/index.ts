import type Address from '../../acai/Address'
import type Agent from '../../acai/Agent'
import type Language from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type { Interaction } from '../../acai/Language'
import { JuntoChannelSearchLinkAdapter } from './linksAdapter'
import { JuntoSettingsUI } from './settingsUI'

function interactions(a: Agent, expression: Address): Interaction[] {
    return []
}

export const name: string = "junto-channel-search-links"

export default function create(context: LanguageContext): Language {
    const linksAdapter = new JuntoChannelSearchLinkAdapter(context)
    const settingsUI = new JuntoSettingsUI()

    return {
        name,
        linksAdapter,
        settingsUI,
        interactions,
    } as Language
}

