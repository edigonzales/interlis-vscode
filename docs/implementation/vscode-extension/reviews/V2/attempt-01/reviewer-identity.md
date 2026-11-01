# Reviewer identity evidence (own checks)

- Running agent identity from the harness: provider `deepseek`, model id `deepseek-flash` (DeepSeek V4.1 Flash 1017).
- `opencode --version` (the binary executing this review): `opencode v2.0.28`
  (path: `/var/folders/.../interlis-without-python-GKevrN/bin/opencode`).
- OpenCode model catalog (`opencode models`, own query): `deepseek/deepseek-flash`,
  display name `DeepSeek V4.1 Flash 1017`, provider `deepseek`, status active.
- Harness configuration reviewed read-only: `reviews/V2-r1/extension/opencode.json`
  sets provider `deepseek` baseURL `https://api.deepseek.com`.
- No `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `OPENAI_BASE_URL` or `DEEPSEEK_BASE_URL`
  is set in the process environment (checked; no credential values read or printed).
- Official mapping independently fetched in this session:
  https://api-docs.deepseek.com/quick_start/pricing/ — model `deepseek-flash`,
  MODEL VERSION `DeepSeek-V4.1-Flash-1017`, BASE URL `https://api.deepseek.com`.
- No OpenRouter/Go/Zen/LiteLLM fallback was used. The model's self-description was
  not used as identity evidence; the catalog plus official mapping plus harness
  configuration were.
