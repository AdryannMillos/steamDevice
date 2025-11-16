import React from 'react'
import ChatWindow from './components/ChatWindow'


export default function App(){
return (
<div style={{ maxWidth: 800, margin: '2rem auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
<h1>Steam Device Chatbot</h1>
<ChatWindow />
</div>
)
}