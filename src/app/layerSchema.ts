import { IUserFeatureSchema, IUserFeatureField } from './types'
import JSON5 from 'json5'
import { Geometry, Feature } from 'geojson'
import { get, initial, last } from 'lodash'
import { treeKey } from './lib'

function createDefaultScheme(): IUserFeatureSchema {
    return {
        version: '1',
        editor: [
            {
                field: 'name',
                view: ['input'],
            }
        ],
    }
}

export function resolveUserFeatureSchema(code: string): IUserFeatureSchema {
    try {
        const rawSchema = JSON5.parse(code)
        const editor = rawSchema['editor'] || 'json'
        const version = rawSchema['version'] || '1'

        return {
            version,
            editor,
            ...rawSchema,
        }
    } catch (error) {
        return createDefaultScheme()
    }
}

export function getEditorField(schema: IUserFeatureSchema, field: string): IUserFeatureField | null {
    if (typeof schema.editor === 'string') {
        return null
    }

    return schema.editor.find(x => x.field === field)
}

export function getSchemaFilterKeys(schema: IUserFeatureSchema): string[] {
    if (Array.isArray(schema.filter)) {
        return schema.filter
    }

    return []
}

export function createFilterConfig(schema: IUserFeatureSchema) {
    if (Array.isArray(schema.filter)) {
        const keys: string[] = schema.filter
        const treeKeysMap = new Map<string, any>()
        const allTreeKeys: string[] = []

        const tree = keys
            .map(field => {
                const editorField = getEditorField(schema, field)
                if (!editorField) {
                    return null
                }

                if (editorField.view[0] !== 'select') {
                    return null
                }

                const children: string[] = editorField.view[1] as any

                // treeKeysMap.set(field, children)
                children.forEach(x => {
                    allTreeKeys.push(treeKey(field, x))
                    treeKeysMap.set(treeKey(field, x), [field, x])
                })

                return {
                    title: field,
                    key: field,
                    field: field,
                    value: null,
                    children: children.map(x => ({
                        title: x,
                        key: treeKey(field, x),
                        value: x,
                        field: field,
                    }))
                }
            })
            .filter(Boolean)

        /*
        [
            {
                title
                key: stage
                field: stage
                value: null
                children: [
                    {
                        title: C
                        key: stage-C
                        field: stage
                        value: C
                    }
                    {
                        title: S
                        key: stage-S
                        field: stage
                        value: S
                    }
                ]
            }
        ]
        */
        
        return { tree, treeKeys: treeKeysMap, allTreeKeys }
    }

    return null
}


export function createPinTextFunction<T, G extends Geometry = Geometry>(schema: IUserFeatureSchema): (feature: Feature<G, T>) => string {
    const x = schema.markerText
    if (!x) {
        return () => ''
    } else if (typeof x === 'string') {
        return () => x
    } else if (Array.isArray(x)) {
        return (obj: object) => {
            const fn = createFunction.apply(null, x)
            return printValue(fn(obj))
        }
    } else {
        return () => ''
    }
}

export function createMarkerColorFunction<T, G extends Geometry = Geometry>(schema: IUserFeatureSchema, defaultColor: string): (feature: Feature<G, T>) => string {
    const x = schema.markerColor
    if (!x) {
        return () => defaultColor
    } else if (typeof x === 'string') {
        return () => x
    } else if (Array.isArray(x)) {
        return (obj: object) => {
            const fn = createFunction.apply(null, x)
            const value = fn(obj)
            return value ? value : defaultColor
        }
    } else {
        return () => defaultColor
    }
}

function createFunction(name: string, ...arg: string[]): (x: object) => string {
    if (name === 'get') {
        return (x: object) => {
            try {
                return get(x, arg[0], '')
            } catch (e) {
                console.error(e)
                return null
            }
        }
    } else if (name === 'fn') {
        const fnArgs = initial(arg)
        const fnBody = last(arg)
        const fn = new Function(...fnArgs, fnBody)

        return (x: object) => {
            try {
                return fn(x)
            } catch (e) {
                console.error(e)
                return null
            }
        }
    }

    return () => ''
}

export function printValue(value: any): string {
    if (typeof value === 'boolean') {
        return value ? '✓' : '✗'
    } else if (typeof value === 'number') {
        return numToStr(value)
    } else if (Array.isArray(value)) {
        return `[${value.length}]`
    } else if (value === null || value === undefined) {
        return `✕`
    }

    return value.toString()
}

function numToStr(value: number): string {
    return value ? `${value}` : ''
}
