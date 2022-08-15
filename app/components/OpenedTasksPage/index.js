import React from 'react'
import moment from 'moment'
import 'moment-duration-format'

import style from './style.css'
import request from '../AuthInterceptor'
import LoadingIcon from '../LoadingIcon'
import PopupHeader from '../PopupHeader'
import PopupNav from '../PopupNav'
import TaskDetail from '../TaskDetail'
import { baseUrl } from '../../cfg'
import store from '../../store'
import withAuthenticated from '../../HOCs/withAuthenticated'

class OpenedTasksPage extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      tasks: undefined,
      trackedTask: store.state.trackedTask,
      autoPauseResume: store.state.autoPauseResume,
      taskExpanded: undefined
    }

    this.handleTaskDetailToggle = this.handleTaskDetailToggle.bind(this)
    this.handleSetList = this.handleSetList.bind(this)
    this.handleGetList = this.handleGetList.bind(this)
    this.handlePlay = this.handlePlay.bind(this)
    this.handlePause = this.handlePause.bind(this)
    this.handleTaskTracking = this.handleTaskTracking.bind(this)

    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.subject === 'taskUpdated') { this.handleSetList(msg.body) }
    })
  }

  componentDidMount () {
    this.handleGetList()

    this.unsubscribe = store.subscribe((state) => {
      this.setState({
        trackedTask: state.trackedTask,
        autoPauseResume: state.autoPauseResume,
      })
    })
  }

  componentWillUnmount() {
    if (!this.unsubscribe) return

    this.unsubscribe()
  }

  handleTaskDetailToggle (id) {
    return () => {
      this.setState({
        taskExpanded: (this.state.taskExpanded === id) ? undefined : id
      })
    }
  }

  handlePlay (id) {
    return () => {
      request.post(`${baseUrl}/api/v1.0/tasks/${id}/play`)
        .then(response => {
          this.handleGetList()
        })
    }
  }

  handlePause (id) {
    return () => {
      store.dispatch({ type: 'STOP_TRACKING_TASK' })

      request.post(`${baseUrl}/api/v1.0/tasks/${id}/pause`)
        .then(response => {
          this.handleGetList()
        })
    }
  }

  handleClose (id) {
    return () => {
      request.post(`${baseUrl}/api/v1.0/tasks/${id}/deliver`)
        .then(response => {
          this.handleGetList()
        })
    }
  }

  handleSetList (tasks) {
    this.setState({
      tasks,
      trackedTask: store.state.trackedTask
    })
  }

  handleGetList () {
    chrome.runtime.sendMessage({
      subject: 'taskUpdateRequest'
    })
  }

  handleTaskTracking (id) {
    return () => {
      store.dispatch({
        type: 'TOGGLE_TRACKING_TASK',
        payload: id
      })

      this.setState({
        trackedTask: store.state.trackedTask
      })
    }
  }

  returnTaskProgress (task) {
    const progress = task.time_worked / task.current_estimate_seconds * 300
    const maxProgress = (progress >= 300) ? 300 : progress
    return maxProgress
  }

  render () {
    const timer = (seconds) => moment.duration(seconds, 'seconds').format('HH:mm', {trim: false})

    const tasks = (() => {
      if (!this.props.authenticated) {
        return (
          <div className='cover-page'>
            <a className='cover-page-button btn btn-block' href='options.html' target='_blank'>Settings Access</a>
          </div>
        )
      } else if (this.state.tasks === undefined) {
        return (
          <p className='text-center'><LoadingIcon visible /></p>
        )
      } else if (this.state.tasks instanceof Array && this.state.tasks.length === 0) {
        return (
          <p className='text-center'>
            No tasks.
          </p>
        )
      } else {
        return this.state.tasks.map((task, index) => (
          <div className={style.RunrunTasksList}>
            <ul className={`list-group ${style.OpenedTasksPage}`}>
              <li key={index}>
                <div className={style.RunrunItem__area}>
                  <span onClick={this.handleTaskDetailToggle(task.id)} className={style.RunrunItem__id}>ID {task.id}</span>
                  <span onClick={this.handleTaskDetailToggle(task.id)} className={style.RunrunItem__name}>{task.title} - {task.project_name}</span>
                  <span className={style.RunrunItem__autoPause}>
                    {(this.state.autoPauseResume && task.is_working_on) ? (
                      <span title='When this option is active the extension will manage the task for you, pausing/resuming if you lock/unlock the machine.' onClick={this.handleTaskTracking(task.id)}>
                        {
                          (this.state.trackedTask == task.id)
                            ? (<img src='/images/auto_pause_red.svg' />)
                            : (<img src='/images/auto_pause_gray.svg' />)
                        }
                      </span>
                    ) : ''}
                  </span>
                </div>
                <div className={`area-enabled-${task.is_working_on}`}>
                  {
                    (task.is_working_on)
                      ? (<span className={style.RunrunItem__actionBtnPause} onClick={this.handlePause(task.id)} title='Pause' />)
                      : (<span className={style.RunrunItem__actionBtnPlay} onClick={this.handlePlay(task.id)} title='Work' />)
                  } <span className={style.RunrunItem__completeBtn} onClick={this.handleClose(task.id)} title='Complete' />
                  {
                    (task.on_going)
                      ? (
                        <div className={style.RunrunItem__progressDiv}>
                          <span className={style.RunrunItem__progressTime}>
                            ONGOING
                          </span>
                          <a href={`${baseUrl}/tasks/${task.id}`} target='_blank' title='Check the task at the website' className={style.RunrunItem__progressLink}><span data-glyph='external-link' className='oi' /></a>
                          <span className={style.RunrunItem__progressBar} />
                        </div>
                      ) : (
                        <div className={style.RunrunItem__progressDiv}>
                          <span className={style.RunrunItem__progressTime}>
                            {
                              timer(task.time_worked)
                            } {
                              (task.current_estimate_seconds) ? '/ ' + timer(task.current_estimate_seconds) : ''
                            }
                          </span>
                          <a href={`${baseUrl}/tasks/${task.id}`} target='_blank' title='Check the task at the website' className={style.RunrunItem__progressLink}><span data-glyph='external-link' className='oi' /></a>
                          <span className={style.RunrunItem__progressBar} />
                          <span className={style.RunrunItem__progressFilledBar} style={{ 'width': this.returnTaskProgress(task) + 'px', 'backgroundColor': (this.returnTaskProgress(task) >= 180) ? '#F77122' : '#38B927' }} />
                        </div>
                      )
                  }
                </div>
                <div>
                  {(this.state.taskExpanded === task.id) ? (
                    <TaskDetail task={task} />
                  ) : ''}
                </div>
              </li>
            </ul>
          </div>
        ))
      }
    })()

    return (
      <div>
        <div>
          <PopupHeader title='Tasks (Open)' />
          <PopupNav routeName='opened' />
        </div>
        {/* <ul className={`list-group ${style.OpenedTasksPage}`}>
          {tasks}
        </ul> */}
        {/* <div className={style.TasksDiv}>
          {tasks}
        </div> */}
        <div className={`${this.props.authenticated ? style.TasksDiv : style.CoverDiv}`}>
          {tasks}
        </div>
      </div>
    )
  }
}

export default withAuthenticated(OpenedTasksPage)
