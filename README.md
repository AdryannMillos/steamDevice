# Steam Devices Chatbot

A chatbot application that provides information about Steam devices. The bot is designed to answer questions based solely on official Steam webpage information, greet the user, and provide quick and efficient responses.

---

## Features

* **RAG (Retrieval-Augmented Generation):** Uses official Steam device information to answer questions.
* **Restricted Prompt:** Only talks about Steam devices and greets users.
* **In-Memory Cache:** Speeds up responses by saving some tokens for performance.
* **Rate Limiter:** Limits requests to 5 questions per minute per IP.
* **OpenAI Evals:** Validates answers against expected scenarios.
* **Langsmith Integration:** Traces and records metrics such as latency, token usage, and more.

**Future Improvements:**

* Use **streams** for incremental responses.
* Integrate **Redis** for more persistent caching.
* Add a cron job to run the evals or incorporate it in a Pipeline

---

## Getting Started

### Backend

1. Clone the project:

```bash
git clone https://github.com/AdryannMillos/steamDevice.git
```

2. Navigate to the backend folder:

```bash
cd backend
```

3. Create a `.env` file in the backend folder and add the following variables:

```env
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=
OPENAI_API_KEY=
```

4. Install dependencies:

```bash
npm install
```

5. Run the backend:

```bash
npm run dev
```

---

### Frontend

1. Navigate to the frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Run the frontend:

```bash
npm run dev
```

---

## Usage

Once both backend and frontend are running, open the frontend in your browser. You can start chatting with the bot about Steam devices.

---

## Tags

`Chatbot` `Steam` `RAG` `OpenAI` `Langsmith` `RateLimiter` `Node.js` `Frontend` `Backend` `Caching` `OpenAI Evals`
