import { arrayToDomains } from '../lib/array'
import { flatMap } from 'lodash'
import { NivoLink } from '../components/Sankey'

export function collect(transitions: Array<[number, string[]]>): NivoLink[] {
    const result = flatMap(transitions, link => {
        const value = link[0] as number
        const transition = link[1] as string[]
        const ts = arrayToDomains(transition)

        return ts.map(([source, target]) => ({
            source,
            target,
            value,
            key: `${source}-${target}`
        }))
    }).reduce((acc, link) => {
        const stored = acc.has(link.key) ? acc.get(link.key) : {
            source: link.source,
            target: link.target,
            value: 0,
        }
        const value = stored.value + link.value
        acc.set(link.key, {
            ...stored,
            value,
        })
        return acc
    }, new Map<string, NivoLink>())

    return Array.from(
        result.values()
    )
}

// colors from category 10 https://github.com/d3/d3-scale-chromatic/blob/master/src/categorical/category10.js
// export const defaultColorSet = ["#2f3843", "#3c3e4c", "#604e64", "#735771", "#825e7b", "#926685", "#ae7397", "#c57da7", "#dd89b6", "#f594c5"]
export const defaultColorSet = ["#4a799b","#617da1", "#7f82a9", "#a288b2", "#c58ebc", "#ed96c7"]
