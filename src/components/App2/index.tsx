import * as React from 'react'
import { ViewState } from 'react-map-gl'
import { AppMap } from './AppMap'
import { Container } from './Container'
import { CaseTree } from './CaseTree'
import { FeatureCollection, Point, Feature } from 'geojson'
import { IFeatureProperties } from '../../app/types'
import { createFeatureMap } from './lib'
import { Button, Select, Drawer } from 'antd'
import { sync } from '../../app/api'
import { Json } from '../Json'
import { filterFeatures, replaceFeatureWithProperties, addPointFeature } from '../../lib/geojson'
import { getCaseKeysSet } from '../../app/lib'
import { isSubset } from '../../lib'

import '../../style.css'

type FC = FeatureCollection<Point, IFeatureProperties>
const ADD_FEATURE_TOOL = 'ADD_FEATURE_TOOL'

export enum ViewMode {
    all = 'all',
    liked = 'liked',
}

export interface IMapViewport extends ViewState {
    transitionDuration?: number
}

export interface IAppProps {
    mapboxToken: string
    center: [number, number]
    zoom: number
    data: FC
    defaultCheckedCaseKeys: string[]
    drawerPlacement: 'right' | 'left' | 'bottom' | 'top'
    mapStyle: string
    mapStyleOption: string
    mapStyleOptions: { value: string, name: string }[]
    onChangeMapStyleOption: (value: string) => void
}

const App: React.FC<IAppProps> = props => {
    const [geojson, setGeojson] = React.useState(props.data)
    const [drawerVisible, setDrawerVisibile] = React.useState(false)
    const [tool, setTool] = React.useState<string>(null)
    const [checkedCaseKeys, setCheckedCaseKeys] = React.useState(props.defaultCheckedCaseKeys)
    const [activeFeatureIndex, setActiveFeatureIndex] = React.useState<number>(null)
    const [isSyncing, setSyncing] = React.useState<boolean>(false)
    const activeFeature = activeFeatureIndex === null ? null : (
        geojson.features[activeFeatureIndex]
    )

    const checkedCaseKeysSet = new Set(checkedCaseKeys)
    const features = filterFeatures(geojson, feature => {
        const cases = getCaseKeysSet(feature.properties.cases)

        return isSubset(checkedCaseKeysSet, cases)
    })
    const isCurrentTool = (x: string) => tool === x

    return (
        <Container>
            <style jsx>{`
                section {
                    position: absolute;
                    background-color: rgba(255, 255, 255, 0.9);
                    width: 100%;
                    top: 0;
                    left: 0;

                    display: flex;
                    align-items: center;
                    justify-content: space-between;

                    padding: 5px 5px;
                }

                h1 {
                    margin: 0;
                    padding: 0 10px;
                }
            `}</style>

            <AppMap
                data={features}
                activeFeature={activeFeature}
                center={props.center}
                zoom={props.zoom}
                mapStyle={props.mapStyle}
                mapboxToken={props.mapboxToken}
                onClickMap={event => {
                    console.log('click', event.lngLat)

                    if (isCurrentTool(ADD_FEATURE_TOOL)) {
                        const latLng = event.lngLat
                        setActiveFeatureIndex(null)
                        setTool(null)
                        setGeojson(addPointFeature(geojson, latLng, {
                            cases: [],
                            id: Math.round(Math.random() * Date.now()),
                            name: '<new feature>',
                        }))
                    }
                }}
                onClickFeature={(feature, index) => {
                    setActiveFeatureIndex(index)
                }}
                onChangeFeatureCases={(feature, cases) => {
                    setGeojson(replaceFeatureWithProperties(geojson, activeFeatureIndex, feature => ({
                        ...feature.properties,
                        cases,
                    })))
                }}
                onChangeFeatureName={(feature, name) => {
                    setGeojson(replaceFeatureWithProperties(geojson, activeFeatureIndex, feature => ({
                        ...feature.properties,
                        name,
                    })))
                }}
            />

            <section>
                <h1>Oymyakon</h1>

                <div>
                    <Button
                        icon={'plus'}
                        disabled={isCurrentTool(ADD_FEATURE_TOOL)}
                        style={{
                            marginRight: 5,
                        }}
                        onClick={() => {
                            setTool(ADD_FEATURE_TOOL)
                        }}
                    />

                    <Button
                        icon={isSyncing ? 'loading' : 'sync'}
                        style={{
                            marginRight: 5,
                        }}
                        onClick={async () => {
                            setSyncing(true)
                            await sync(geojson)
                            setSyncing(false)
                        }}
                    />

                    <Button
                        icon={'menu'}

                        onClick={() => {
                            setDrawerVisibile(!drawerVisible)
                        }}
                    />
                </div>
            </section>

            <Drawer
                title={'Oymyakon Options'}
                width={'25%'}
                placement={props.drawerPlacement}
                mask={false}
                onClose={() => { setDrawerVisibile(false) }}
                visible={drawerVisible}
                className={'app-drawer'}
            >
                <CaseTree
                    checkedKeys={checkedCaseKeys}
                    onCheck={setCheckedCaseKeys}
                    style={{
                        marginBottom: 15,
                    }}
                />

                <Select
                    defaultValue={props.mapStyleOption}
                    style={{
                        width: '100%',
                        marginRight: 5,
                    }}
                    onChange={props.onChangeMapStyleOption}
                >
                    {props.mapStyleOptions.map(x => (
                        <Select.Option
                            key={x.value}
                            value={x.value}
                        >
                            {x.name}
                        </Select.Option>
                    ))}
                </Select>
            </Drawer>
        </Container>
    )
}

export default App
