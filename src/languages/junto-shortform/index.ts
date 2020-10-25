import type Address from '../../acai/Address'
import type Agent from '../../acai/Agent'
import type Language from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type { Interaction } from '../../acai/Language'
import Adapter from './adapter'
import Icon from './build/Icon.js'
import ConstructorIcon from './build/ConstructorIcon.js'
import { JuntoSettingsUI } from './SettingsUI'


function iconFor(expression: Address): string {
    return Icon
}

function constructorIcon(): string {
    return ConstructorIcon
}

function interactions(a: Agent, expression: Address): Interaction[] {
    return []
}

export const name: string = "junto-shortform"

export default function create(context: LanguageContext): Language {
    const expressionAdapter = new Adapter(context)
    const settingsUI = new JuntoSettingsUI(context)

    return {
        name: 'junto-centralized',
        expressionAdapter,
        iconFor,
        constructorIcon,
        interactions,
        settingsUI
    } as Language
}
