import axios from 'axios';

export async function storeMemory(content, tags) {
  const { BRIAN_MEM_URL, BRIAN_MEM_USER, BRIAN_MEM_PASS } = process.env;
  if (!BRIAN_MEM_URL) return null;

  const { data } = await axios.post(
    `${BRIAN_MEM_URL}/memory`,
    { content, metadata: { tags } },
    { auth: { username: BRIAN_MEM_USER, password: BRIAN_MEM_PASS } }
  );
  return data;
}
