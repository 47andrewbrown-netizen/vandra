"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  role: "assistant" | "user"
  content: string
}

const INITIAL_MESSAGE: Message = {
  id: "1",
  role: "assistant",
  content: "Hey! 👋 I'm so excited to help you find amazing flight deals. Let's start with the basics—where do you usually fly out of?",
}

export default function OnboardingChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [isTyping])

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsTyping(true)

    try {
      // Call Claude API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await response.json()

      if (data.message) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message,
        }

        setMessages((prev) => [...prev, assistantMessage])

        // Check if conversation seems complete (Claude mentions being "all set" or similar)
        const lowerMessage = data.message.toLowerCase()
        if (
          lowerMessage.includes("all set") ||
          lowerMessage.includes("everything i need") ||
          lowerMessage.includes("got everything") ||
          lowerMessage.includes("you're going to love")
        ) {
          // Save the flight preferences
          try {
            await fetch("/api/chat/extract", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages: [...updatedMessages, { role: "assistant", content: data.message }],
              }),
            })
          } catch (err) {
            console.error("Failed to save preferences:", err)
          }
          setTimeout(() => setIsComplete(true), 1500)
        }
      }
    } catch (error) {
      console.error("Failed to get response:", error)
      // Fallback message
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I had a moment there. What were you saying?",
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto">
      {/* Chat Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-stone-200)]">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-teal-500)] flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
        <div>
          <h2 className="font-medium text-[var(--color-stone-900)]">Your Flight Agent</h2>
          <p className="text-xs text-[var(--color-stone-500)]">
            {isTyping ? "Typing..." : "Usually replies instantly"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4">
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-teal-500)] flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div className="bg-[var(--color-stone-100)] rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[var(--color-stone-400)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-[var(--color-stone-400)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-[var(--color-stone-400)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="text-center py-6">
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary-600)] text-white rounded-full font-medium hover:bg-[var(--color-primary-700)] transition-colors"
            >
              View your dashboard
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isComplete && (
        <div className="border-t border-[var(--color-stone-200)] pt-4">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isTyping}
              className="flex-1 px-4 py-3 bg-[var(--color-stone-100)] rounded-full text-[var(--color-stone-900)] placeholder:text-[var(--color-stone-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="h-12 w-12 rounded-full bg-[var(--color-primary-600)] text-white flex items-center justify-center hover:bg-[var(--color-primary-700)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-teal-500)] flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
      )}
      
      <div
        className={`max-w-[80%] px-4 py-3 ${
          isUser
            ? "bg-[var(--color-primary-600)] text-white rounded-2xl rounded-tr-md"
            : "bg-[var(--color-stone-100)] text-[var(--color-stone-900)] rounded-2xl rounded-tl-md"
        }`}
      >
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}
