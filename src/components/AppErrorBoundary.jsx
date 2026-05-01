import React from 'react'
import { Button, Card, CardContent } from './ui'

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('DBD app crashed:', error)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell" dir="rtl">
          <div className="page">
            <Card>
              <CardContent className="stack-3 center">
                <h2 style={{ margin: 0, fontSize: 24 }}>حدث خطأ غير متوقع</h2>
                <p className="muted" style={{ margin: 0, lineHeight: 1.8 }}>
                  تم إيقاف الشاشة الحالية لحماية البيانات. يمكنك إعادة تحميل الصفحة والمحاولة مرة أخرى.
                </p>
                <Button onClick={this.handleReload}>إعادة تحميل التطبيق</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
