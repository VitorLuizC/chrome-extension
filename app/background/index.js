import axios from 'axios'
import moment from 'moment'
import { baseUrl } from '../cfg'
import store from '../store'
import FetchAdapter from '@vespaiach/axios-fetch-adapter'

class RunrunTasks {
  constructor () {
    this._tasks = undefined
    this._is_working_on = store.state.is_working_on
    this._reminder = moment(store.state.reminder)
    this.updateTasks = this.updateTasks.bind(this)
  }

  getHttpClient () {
    const client = axios.create({
      baseURL: `${baseUrl}/api/v1.0/`,
      adapter: FetchAdapter
    })

    client.interceptors.request.use((config) => {
      config.headers['App-Key'] = store.state.appkey
      config.headers['User-Token'] = store.state.usertoken

      return config
    })
    return client
  }

  getUser () {
    return new Promise((resolve, reject) => {
      if (store.state.user) {
        resolve(store.state.user)
        return
      }

      const request = this.getHttpClient()
      request.get(`users/me`)
        .then(response => {
          store.dispatch({
            type: 'SET_USER',
            payload: response.data
          })
          resolve(response.data)
        })
        .catch(reject)
    })
  }

  updateTasks () {
    const request = this.getHttpClient()
    this.getUser()
      .then(user => {
        return request.get(`tasks`, {
          params: {
            sort: 'priority',
            sort_dir: 'asc',
            limit: 10,
            is_closed: false,
            task_list_user_id: user.id || ''
          }
        })
      })
      .then(response => {
        this._tasks = response.data

        const workingTask = this._tasks.find((task) => {
          return task.is_working_on
        })

        const trackedTask = store.state.trackedTask
        if (trackedTask) {
          const trackedTaskOnTaskList = this._tasks.find((task) => {
            return task.id == trackedTask
          })
          if (trackedTaskOnTaskList === undefined || (workingTask !== undefined && workingTask.id !== trackedTaskOnTaskList.id)) {
            store.dispatch({ type: 'STOP_TRACKING_TASK' })
          }
        }

        if (this._is_working_on && workingTask === undefined) {
          this._reminder = moment()
          chrome.notifications.create(
            'runrunit_task_notification', {
              'type': 'basic',
              'iconUrl': 'images/icon_128_alert.png',
              'title': 'Pause!!!',
              'message': `You have stopped working on "${this._is_working_on.title}".`
            },
            () => {}
          )
        } else if (workingTask !== undefined && (!this._is_working_on || this._is_working_on.id !== workingTask.id)) {
          this._reminder = moment()
          chrome.notifications.create(
            'runrunit_task_notification', {
              'type': 'basic',
              'iconUrl': 'images/icon_128_alert_active.png',
              'title': 'Work!!!',
              'message': `You are now working on "${workingTask.title}".`
            },
            () => {}
          )
        }

        if (workingTask) {
          this._is_working_on = workingTask
          chrome.browserAction.setIcon({path: 'images/icon_128_active.png'})
        } else {
          this._is_working_on = null
          chrome.browserAction.setIcon({path: 'images/icon_128.png'})
        }

        const reminderEnabled = store.state.reminderEnabled
        const reminderTime = store.state.reminderTimeInMinutes
        if (reminderEnabled && this._reminder.isSameOrBefore(moment().subtract(reminderTime, 'm'))) {
          this._reminder = moment()
          if (this._is_working_on) {
            chrome.notifications.create(
              'runrunit_task_notification', {
                'type': 'basic',
                'iconUrl': 'images/icon_128_alert_active.png',
                'title': 'Reminder!!!',
                'message': `You are still working on "${this._is_working_on.title}".`
              },
              () => {}
            )
          } else {
            chrome.notifications.create(
              'runrunit_task_notification', {
                'type': 'basic',
                'iconUrl': 'images/icon_128_alert.png',
                'title': 'Reminder!!!',
                'message': `You have no tasks currently in progress.`
              },
              () => {}
            )
          }
        }

        store.dispatch({
          type: 'SET_WORKING_ON_TASK',
          payload: this._is_working_on,
        })

        store.dispatch({
          type: 'SET_REMINDER',
          payload: this._reminder
        })

        chrome.runtime.sendMessage({
          subject: 'taskUpdated',
          body: response.data
        })
      })
      .catch(e => {
        console.error(e)
        chrome.runtime.sendMessage({
          subject: 'taskUpdated',
          body: []
        })
      })
  }

  pauseTask (id) {
    const request = this.getHttpClient()
    request.post(`tasks/${id}/pause`)
      .then(response => {
        this.updateTasks()
      })
  }

  resumeTask (id) {
    const request = this.getHttpClient()
    request.post(`tasks/${id}/play`)
      .then(response => {
        this.updateTasks()
      })
  }
}

store.initialization.then(() => {
  const UserRunrunTasks = new RunrunTasks()

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'updateTasks') {
      const hasAppKey = !!store.state.appkey
      if (hasAppKey && store.state.lastMachineStatus === 'active') { UserRunrunTasks.updateTasks() }
    }
  })

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.subject === 'taskUpdateRequest') {
      UserRunrunTasks.updateTasks()
    }
  })

  chrome.idle.setDetectionInterval(15)
  chrome.idle.onStateChanged.addListener(state => {
    state = (state === 'idle') ? 'active' : state
    if (store.state.autoPauseResume && store.state.lastMachineStatus !== state && store.state.trackedTask) {
      if (state === 'locked') { UserRunrunTasks.pauseTask(store.state.trackedTask) } else if (state === 'active') { UserRunrunTasks.resumeTask(store.state.trackedTask) }
    }
    store.dispatch({
      type: 'SET_MACHINE_STATUS',
      payload: state
    })
  })

  chrome.alarms.create('updateTasks', {
    periodInMinutes: 0.5
  })
})
