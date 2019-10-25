import * as React from 'react'

import axios from 'axios'
import { useRequest } from 'use-request-hook'

import lowdb from 'lowdb'
import Memory from 'lowdb/adapters/Memory'

const loadDb = async () => {
    const res = await axios.get('/static/db.json')
    return res.data
}

export function useData() {
    const { isLoading, data } = useRequest(loadDb, {})
    const [projects, setProjects] = React.useState([])
    const [layers, setLayers] = React.useState([])
    const [features, setFeatures] = React.useState([])

    React.useEffect(() => {
        if (isLoading) {
            return
        }

        const m = new (Memory as any)()
        const low = lowdb(m) as any
        low.setState(data)

        setProjects(low.get('projects').value())
        setLayers(low.get('layers').value())

        const featureValues = low.get('features').value()
        setFeatures(featureValues.map(x => x.feature))
    }, [isLoading])

    return [projects, layers, features]
}