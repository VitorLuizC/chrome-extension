import React from 'react'
import style from './style.css'
import PropTypes from 'prop-types'
import { baseUrl } from '../../cfg'
import withAuthenticated from '../../HOCs/withAuthenticated'

const url = `${baseUrl}/en-US/tasks`

class PopupHeader extends React.Component {
  constructor (props) {
    super(props)
  }

  render () {
    if (!this.props.authenticated) {
      return (
        <span />
      )
    } else {
      return (
        <header className={style.RunrunHeader}>
          <div className={style.RunrunHeader__left}>
            <a href={url} target='_blank'>
              <img src='images/rr.svg' className={style.RunrunIcon} />
            </a>
            <span className={style.RunrunHeader__left_title}>{this.props.title}</span>
            <span>RUNRUN.IT</span>
          </div>
          <div className={style.RunrunHeader__right}>
            <a href='options.html' target='_blank'><img src='/images/gear.svg' className={style.Settings} /></a>
          </div>
        </header>
      )
    }
  }
}

PopupHeader.propTypes = {
  title: PropTypes.string.isRequired,
  authenticated: PropTypes.bool.isRequired
}

export default withAuthenticated(PopupHeader)
