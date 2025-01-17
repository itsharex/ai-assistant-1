import { getConvasitionData, setConvasitionData } from '@/utils/store'
import { getRandomId } from '@/utils/tools'
import { useLatest } from 'ahooks'
import clsx from 'clsx'
import {
  Dispatch,
  SetStateAction,
  createContext,
  useEffect,
  useState
} from 'react'

import Chatgpt from './Chatgpt'
import LayoutSider from './LayoutSider'
import styles from './layoutIndex.less'
import SettingModal from './components/SettingModal'

interface IChatContext {
  result: IConvasition[]
  active: IConvasition | null
  setResult: Dispatch<SetStateAction<IConvasition[]>>
  setResultDataBySessionId: (
    appendData: { append: Array<Answer.answer>; isLoading: boolean },
    sessionId: string
  ) => void
  storageData: (data: IConvasition) => void
  addResult: () => void
  deleteResult: (sessionId: string) => void
  toggleActive: (sessionId: string) => void
  getConvasitionBySessionId: (sessionId: string) => IConvasition | undefined
  setResultBySessionId: (
    params: Partial<IConvasition>,
    sessionId: string
  ) => void
  getActiveResult: () => IConvasition | undefined
  setOpenSetting: (open: boolean) => void
  setModeType: (type: 'createModel' | 'editModel') => void
}

const getOrder = (res: IConvasition[], index: number): number => {
  if (res.find((r) => r.order === index)) {
    return getOrder(res, index + 1)
  }
  return index
}

const ChatContext = createContext<IChatContext>({
  result: [],
  active: null,
  setResult: () => {},
  setResultDataBySessionId: () => {},
  storageData: () => {},
  addResult: () => {},
  deleteResult: () => {},
  toggleActive: () => {},
  getConvasitionBySessionId: () => undefined,
  setResultBySessionId: () => {},
  getActiveResult: () => undefined,
  setOpenSetting: () => {},
  setModeType: () => {}
})

function useGetActive(result: IConvasition[]) {
  const [active, setActive] = useState<IConvasition | null>(getActive)

  function getActive() {
    return result.find((r) => r.active) ?? null
  }

  useEffect(() => {
    setActive(getActive())
  }, [JSON.stringify(result)])

  return active
}

function LayoutIndex() {
  const [result, setResult] = useState<IConvasition[]>([])
  const active = useGetActive(result)
  const [openSetting, setOpenSetting] = useState(false)
  const [modeType, setModeType] = useState(
    'createModel' as 'createModel' | 'editModel'
  )

  const latestResultRef = useLatest(result)

  useEffect(() => {
    initialData()
  }, [])

  async function initialData() {
    const res = (await getConvasitionData()) as IConvasition[]
    if (res) {
      const data: IConvasition[] = res
      data.forEach((item) => {
        // 初始化时，所有的tab都不需要正在输入态
        item.isInput = false
      })
      setResult(data)
    } else {
      const defaultData: IConvasition = {
        sessionId: getRandomId(),
        active: true,
        title: '会话1',
        order: 0,
        data: [],
        parentMessageId: '',
        isLoading: false,
        isInput: false,
        modelId: ''
      }
      setResult([defaultData])
    }
  }

  function setResultDataBySessionId(
    appendData: { append: Array<Answer.answer>; isLoading: boolean },
    sessionId: string
  ) {
    console.log(
      '-- setResultDataBySessionId result',
      latestResultRef.current,
      appendData
    )
    const res = latestResultRef.current.map((item) => {
      if (item.sessionId === sessionId) {
        const newData = [...item.data]
        newData.push(...appendData.append)
        return {
          ...item,
          ...{ data: newData, isLoading: appendData.isLoading }
        }
      }
      return { ...item }
    })
    setResult(res)
  }

  function setResultBySessionId(
    params: Partial<IConvasition>,
    sessionId: string
  ) {
    console.log(
      '-- setResultBySessionId result',
      latestResultRef.current,
      params,
      sessionId
    )
    const res = latestResultRef.current.map((item) => {
      if (item.sessionId === sessionId) {
        return {
          ...item,
          ...params
        }
      }
      return { ...item }
    })
    setResult(res)
  }

  function storageData(data: IConvasition) {
    // const res = latestResultRef.current.filter((o) => o.type !== 'loading');
    const newResult = [...latestResultRef.current]
    const index = newResult.findIndex((r) => r.sessionId === data.sessionId)
    if (index > -1) {
      newResult[index] = data
    }
    if (newResult.length) {
      setConvasitionData(newResult)
    }
  }

  function addResult() {
    const newResult = [...latestResultRef.current]
    const newSession: IConvasition = {
      sessionId: getRandomId(),
      active: true,
      title: `会话${newResult.length + 1}`,
      order: getOrder(newResult, newResult.length),
      data: [],
      parentMessageId: '',
      isLoading: false,
      isInput: false,
      modelId: ''
    }
    newResult.forEach((item) => {
      item.active = false
    })
    newResult.push(newSession)
    setResult(newResult)
  }

  function deleteResult(sessionId: string) {
    const newResult = [...latestResultRef.current]
    const index = newResult.findIndex((r) => r.sessionId === sessionId)
    const convasition = newResult.find((r) => r.sessionId === sessionId)
    if (index > -1) {
      newResult.splice(index, 1)
      if (convasition?.active && newResult[newResult.length - 1]) {
        newResult[newResult.length - 1].active = true
      }
    }
    if (newResult.length) {
      setResult(newResult)
    } else {
      const defaultData: IConvasition = {
        sessionId: getRandomId(),
        active: true,
        title: '会话1',
        order: 0,
        data: [],
        parentMessageId: '',
        isLoading: false,
        isInput: false,
        modelId: ''
      }
      setResult([defaultData])
    }
  }

  function toggleActive(sessionId: string) {
    const newResult = [...latestResultRef.current]
    newResult.forEach((item) => {
      item.active = item.sessionId === sessionId
    })
    setResult(newResult)
  }

  function getConvasitionBySessionId(sessionId: string) {
    return latestResultRef.current.find((r) => r.sessionId === sessionId)
  }

  function getActiveResult() {
    return latestResultRef.current.find((r) => r.active)
  }

  useEffect(() => {
    setConvasitionData([...latestResultRef.current])
  }, [latestResultRef.current.length])

  return (
    <>
      <ChatContext.Provider
        value={{
          result,
          active,
          setResult,
          setResultDataBySessionId,
          storageData,
          addResult,
          deleteResult,
          toggleActive,
          getConvasitionBySessionId,
          setResultBySessionId,
          getActiveResult,
          setOpenSetting,
          setModeType
        }}
      >
        <div
          className={clsx(
            'flex',
            'flex-row',
            'items-center',
            'w-100%',
            'h-100%',
            'p-200px',
            'pt-100px',
            'pb-100px',
            styles.layout
          )}
        >
          <div className={styles.layoutAi}>
            <LayoutSider />
            <Chatgpt />
          </div>
        </div>
        <SettingModal
          type={modeType}
          open={openSetting}
          setOpen={setOpenSetting}
          setType={setModeType}
        ></SettingModal>
      </ChatContext.Provider>
    </>
  )
}

export default LayoutIndex
export { ChatContext }
