import {flatMap} from 'lodash'
import { ICase } from './types'

export function treeKey(prefix: string, value: string): string {
    return `${prefix}-${value}`
}

export function caseKey(prefix: string, caseValue: string): string {
    return treeKey(prefix, caseValue)
}

export function getCaseKeysSet(cases: ICase[]): Set<string> {
    return new Set(flatMap(cases, x => [
            caseKey('topic', x.topic),
            caseKey('user', x.user),
            caseKey('season', x.season),
        ])
    )
}

export function getCaseKeys(caseItem: ICase): string[] {
    return [
        caseKey('topic', caseItem.topic),
        caseKey('user', caseItem.user),
        caseKey('season', caseItem.season),
    ].filter(Boolean)
}
