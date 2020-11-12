import type Address from '../../acai/Address'
import type Agent from '../../acai/Agent'
import type Language from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'
import type { Interaction } from '../../acai/Language'
import PhotoFormAdapter from './adapter'
import Icon from './build/Icon.js'
import ConstructorIcon from './build/ConstructorIcon.js'
import { JuntoSettingsUI } from './SettingsUI'
import { PhotoFormExpressionUI } from './photoFormExpressionUI'


function iconFor(expression: Address): string {
    return Icon
}

function constructorIcon(): string {
    return ConstructorIcon
}

function interactions(a: Agent, expression: Address): Interaction[] {
    return []
}

export const name: string = "junto-photoform"

export default function create(context: LanguageContext): Language {
    const expressionAdapter = new PhotoFormAdapter(context)
    const settingsUI = new JuntoSettingsUI()
    const expressionUI = new PhotoFormExpressionUI()

    return {
        name,
        expressionAdapter,
        iconFor,
        constructorIcon,
        interactions,
        settingsUI,
        expressionUI
    } as Language
}
