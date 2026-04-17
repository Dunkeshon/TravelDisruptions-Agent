export default function App() {
  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          background: #e5e5e5;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .phone {
          width: 393px;
          height: 852px;
          background: #f9f9f9;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          box-shadow: 0 40px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08);
          border-radius: 48px;
        }

        /* ── Header ── */
        .header {
          background: #fff;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          border-bottom: 1px solid #f4f4f5;
          flex-shrink: 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-title {
          font-size: 20px;
          letter-spacing: -0.5px;
          color: #18181b;
        }

        /* ── Main scrollable area ── */
        .main {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-bottom: 8px;
        }

        .main::-webkit-scrollbar { display: none; }

        /* ── Welcome section ── */
        .welcome {
          padding: 0 16px;
          padding-top: 4px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .agent-label {
          font-size: 11px;
          letter-spacing: 0.55px;
          color: #777;
          text-transform: uppercase;
        }

        .agent-name {
          font-size: 48px;
          line-height: 60px;
          color: #000;
          padding-bottom: 8px;
        }

        .divider {
          width: 48px;
          height: 2px;
          background: #000;
        }

        /* ── Conversation ── */
        .conversation {
          padding: 0 16px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* AI Message */
        .ai-message {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 290px;
        }

        .msg-sender {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 16px;
        }

        .msg-sender-label {
          font-size: 11px;
          letter-spacing: 0.55px;
          color: #777;
          text-transform: uppercase;
        }

        .ai-bubble {
          background: #fff;
          border: 1px solid rgba(198,198,198,0.3);
          padding: 25px 25px 25px 25px;
          font-size: 14px;
          line-height: 22.75px;
          color: #474747;
        }

        .timestamp {
          padding-top: 8px;
          font-size: 10px;
          letter-spacing: 0;
          color: #777;
          text-transform: uppercase;
        }

        /* User Message */
        .user-message {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          max-width: 290px;
          align-self: flex-end;
          margin-top: 28px;
        }

        .msg-sender.right {
          flex-direction: row;
        }

        .user-bubble {
          background: #000;
          padding: 24px 24px;
          font-size: 14px;
          line-height: 22.75px;
          color: #e2e2e2;
        }

        .timestamp.right {
          text-align: right;
        }

        /* ── Bottom section ── */
        .bottom {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Input area */
        .input-wrapper {
          padding: 0 20px;
        }

        .input-field {
          background: #fff;
          height: 49px;
          border: 1px solid rgba(198,198,198,0.5);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          padding: 0 17px;
          gap: 12px;
        }

        .input-field input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          color: #18181b;
          font-family: inherit;
        }

        .input-field input::placeholder {
          color: rgba(119,119,119,0.5);
        }

        .send-btn {
          width: 32px;
          height: 32px;
          background: #000;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          padding: 8px;
        }

        /* Bottom nav */
        .bottom-nav {
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          height: 80px;
          border-top: 1px solid #f4f4f5;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 53.7px;
          padding: 0 60px;
          box-shadow: 0 -4px 6px -4px rgba(0,0,0,0.05);
        }

        .nav-item {
          width: 50px;
          height: 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 4px 12px;
          cursor: pointer;
          border-radius: 0;
          text-decoration: none;
        }

        .nav-item.active {
          background: #fef7f7;
          border-radius: 10px;
        }

        .nav-label {
          font-size: 11px;
          letter-spacing: 0.275px;
          color: #a1a1aa;
          margin-top: 2px;
        }

        .nav-item.active .nav-label {
          color: #ff5149;
        }
      `}</style>

      <div className="phone">

        {/* ── Header ── */}
        <header className="header">
          <div className="header-left">
            {/* Hamburger */}
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
              <path d="M0 12V10H18V12H0ZM0 7V5H18V7H0ZM0 2V0H18V2H0Z" fill="#18181B"/>
            </svg>
            <span className="header-title">Wayra</span>
          </div>
          {/* Profile */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3.85 15.1C4.7 14.45 5.65 13.9375 6.7 13.5625C7.75 13.1875 8.85 13 10 13C11.15 13 12.25 13.1875 13.3 13.5625C14.35 13.9375 15.3 14.45 16.15 15.1C16.7333 14.4167 17.1875 13.6417 17.5125 12.775C17.8375 11.9083 18 10.9833 18 10C18 7.78333 17.2208 5.89583 15.6625 4.3375C14.1042 2.77917 12.2167 2 10 2C7.78333 2 5.89583 2.77917 4.3375 4.3375C2.77917 5.89583 2 7.78333 2 10C2 10.9833 2.1625 11.9083 2.4875 12.775C2.8125 13.6417 3.26667 14.4167 3.85 15.1ZM10 11C9.01667 11 8.1875 10.6625 7.5125 9.9875C6.8375 9.3125 6.5 8.48333 6.5 7.5C6.5 6.51667 6.8375 5.6875 7.5125 5.0125C8.1875 4.3375 9.01667 4 10 4C10.9833 4 11.8125 4.3375 12.4875 5.0125C13.1625 5.6875 13.5 6.51667 13.5 7.5C13.5 8.48333 13.1625 9.3125 12.4875 9.9875C11.8125 10.6625 10.9833 11 10 11ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C10.8833 18 11.7167 17.8708 12.5 17.6125C13.2833 17.3542 14 16.9833 14.65 16.5C14 16.0167 13.2833 15.6458 12.5 15.3875C11.7167 15.1292 10.8833 15 10 15C9.11667 15 8.28333 15.1292 7.5 15.3875C6.71667 15.6458 6 16.0167 5.35 16.5C6 16.9833 6.71667 17.3542 7.5 17.6125C8.28333 17.8708 9.11667 18 10 18Z" fill="#18181B"/>
          </svg>
        </header>

        {/* ── Main content ── */}
        <div className="main">

          {/* Welcome section */}
          <div className="welcome">
            <div className="agent-label">AGENT 01 // ACTIVE</div>
            <div className="agent-name">Wayra</div>
            <div className="divider" />
          </div>

          {/* Conversation */}
          <div className="conversation">

            {/* AI Message */}
            <div className="ai-message">
              <div className="msg-sender">
                {/* Robot/System icon */}
                <svg width="16.5" height="14.25" viewBox="0 0 16.5 14.25" fill="none">
                  <path d="M2.25 9.75C1.625 9.75 1.09375 9.53125 0.65625 9.09375C0.21875 8.65625 0 8.125 0 7.5C0 6.875 0.21875 6.34375 0.65625 5.90625C1.09375 5.46875 1.625 5.25 2.25 5.25V3.75C2.25 3.3375 2.39687 2.98437 2.69062 2.69062C2.98437 2.39687 3.3375 2.25 3.75 2.25H6C6 1.625 6.21875 1.09375 6.65625 0.65625C7.09375 0.21875 7.625 0 8.25 0C8.875 0 9.40625 0.21875 9.84375 0.65625C10.2812 1.09375 10.5 1.625 10.5 2.25H12.75C13.1625 2.25 13.5156 2.39687 13.8094 2.69062C14.1031 2.98437 14.25 3.3375 14.25 3.75V5.25C14.875 5.25 15.4062 5.46875 15.8438 5.90625C16.2812 6.34375 16.5 6.875 16.5 7.5C16.5 8.125 16.2812 8.65625 15.8438 9.09375C15.4062 9.53125 14.875 9.75 14.25 9.75V12.75C14.25 13.1625 14.1031 13.5156 13.8094 13.8094C13.5156 14.1031 13.1625 14.25 12.75 14.25H3.75C3.3375 14.25 2.98437 14.1031 2.69062 13.8094C2.39687 13.5156 2.25 13.1625 2.25 12.75V9.75ZM6 8.25C6.3125 8.25 6.57812 8.14062 6.79688 7.92188C7.01562 7.70312 7.125 7.4375 7.125 7.125C7.125 6.8125 7.01562 6.54688 6.79688 6.32812C6.57812 6.10938 6.3125 6 6 6C5.6875 6 5.42188 6.10938 5.20312 6.32812C4.98438 6.54688 4.875 6.8125 4.875 7.125C4.875 7.4375 4.98438 7.70312 5.20312 7.92188C5.42188 8.14062 5.6875 8.25 6 8.25ZM10.5 8.25C10.8125 8.25 11.0781 8.14062 11.2969 7.92188C11.5156 7.70312 11.625 7.4375 11.625 7.125C11.625 6.8125 11.5156 6.54688 11.2969 6.32812C11.0781 6.10938 10.8125 6 10.5 6C10.1875 6 9.92188 6.10938 9.70312 6.32812C9.48438 6.54688 9.375 6.8125 9.375 7.125C9.375 7.4375 9.48438 7.70312 9.70312 7.92188C9.92188 8.14062 10.1875 8.25 10.5 8.25ZM5.25 11.25H11.25V9.75H5.25V11.25Z" fill="#1A1C1C"/>
                </svg>
                <span className="msg-sender-label">SYSTEM</span>
              </div>
              <div className="ai-bubble">
                Welcome to Flow. I have initialized your backpacking profile. Are you planning a multi-day trek or a nomadic urban journey? I can help optimize your gear weight and terrain strategy.
              </div>
              <div className="timestamp">10:42 AM</div>
            </div>

            {/* User Message */}
            <div className="user-message">
              <div className="msg-sender right">
                <span className="msg-sender-label">EXPLORER</span>
                {/* Person icon */}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 6C5.175 6 4.46875 5.70625 3.88125 5.11875C3.29375 4.53125 3 3.825 3 3C3 2.175 3.29375 1.46875 3.88125 0.88125C4.46875 0.29375 5.175 0 6 0C6.825 0 7.53125 0.29375 8.11875 0.88125C8.70625 1.46875 9 2.175 9 3C9 3.825 8.70625 4.53125 8.11875 5.11875C7.53125 5.70625 6.825 6 6 6ZM0 12V9.9C0 9.475 0.109375 9.08437 0.328125 8.72812C0.546875 8.37187 0.8375 8.1 1.2 7.9125C1.975 7.525 2.7625 7.23438 3.5625 7.04063C4.3625 6.84688 5.175 6.75 6 6.75C6.825 6.75 7.6375 6.84688 8.4375 7.04063C9.2375 7.23438 10.025 7.525 10.8 7.9125C11.1625 8.1 11.4531 8.37187 11.6719 8.72812C11.8906 9.08437 12 9.475 12 9.9V12H0Z" fill="#1A1C1C"/>
                </svg>
              </div>
              <div className="user-bubble">
                I'm looking at a 4-day loop in the North Cascades. High elevation, potential for early snow. I need a lightweight packing list for sub-zero temperatures.
              </div>
              <div className="timestamp right">10:45 AM</div>
            </div>

          </div>
        </div>

        {/* ── Bottom: input + nav ── */}
        <div className="bottom">
          <div className="input-wrapper">
            <div className="input-field">
              <input type="text" placeholder="Ask about gear, trails, or logistics..." />
              <button className="send-btn">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M7 16V3.825L1.4 9.425L0 8L8 0L16 8L14.6 9.425L9 3.825V16H7Z" fill="#E2E2E2"/>
                </svg>
              </button>
            </div>
          </div>

          <nav className="bottom-nav">
            {/* Explore */}
            <div className="nav-item">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5.5 14.5L12.5 12.5L14.5 5.5L7.5 7.5L5.5 14.5ZM10 11.5C9.58333 11.5 9.22917 11.3542 8.9375 11.0625C8.64583 10.7708 8.5 10.4167 8.5 10C8.5 9.58333 8.64583 9.22917 8.9375 8.9375C9.22917 8.64583 9.58333 8.5 10 8.5C10.4167 8.5 10.7708 8.64583 11.0625 8.9375C11.3542 9.22917 11.5 9.58333 11.5 10C11.5 10.4167 11.3542 10.7708 11.0625 11.0625C10.7708 11.3542 10.4167 11.5 10 11.5ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2167 18 14.1042 17.2208 15.6625 15.6625C17.2208 14.1042 18 12.2167 18 10C18 7.78333 17.2208 5.89583 15.6625 4.3375C14.1042 2.77917 12.2167 2 10 2C7.78333 2 5.89583 2.77917 4.3375 4.3375C2.77917 5.89583 2 7.78333 2 10C2 12.2167 2.77917 14.1042 4.3375 15.6625C5.89583 17.2208 7.78333 18 10 18Z" fill="#A1A1AA"/>
              </svg>
              <span className="nav-label">Explore</span>
            </div>

            {/* Chat (active) */}
            <div className="nav-item active">
              <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                <path d="M0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H18C18.55 0 19.0208 0.195833 19.4125 0.5875C19.8042 0.979167 20 1.45 20 2V14C20 14.55 19.8042 15.0208 19.4125 15.4125C19.0208 15.8042 18.55 16 18 16H4L0 20V16ZM4 12H12V10H4V12ZM4 9H16V7H4V9ZM4 6H16V4H4V6Z" fill="#FF5149"/>
              </svg>
              <span className="nav-label">Chat</span>
            </div>

            {/* Journal */}
            <div className="nav-item">
              <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                <path d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H14C14.55 0 15.0208 0.195833 15.4125 0.5875C15.8042 0.979167 16 1.45 16 2V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20H2ZM2 18H14V2H12V9L9.5 7.5L7 9V2H2V18Z" fill="#A1A1AA"/>
              </svg>
              <span className="nav-label">Journal</span>
            </div>
          </nav>
        </div>

      </div>
    </>
  );
}
