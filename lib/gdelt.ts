export type GdeltArticle = { title:string; url:string; domain?:string; seendate?:string };
type GdeltResponse = { articles?:GdeltArticle[] };

/** GDELT DOC 2.0 is public: it needs no browser-exposed API key. */
export async function getGdeltNews(topic:"ai"|"motorsport") {
  const query = topic === "ai" ? "(artificial intelligence OR machine learning OR LLM)" : "(Formula 1 OR MotoGP OR WEC OR IndyCar OR motorsport)";
  const params = new URLSearchParams({query,mode:"ArtList",format:"json",maxrecords:"8",sort:"HybridRel"});
  const response = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?${params}`,{next:{revalidate:900},headers:{"User-Agent":"Watchtower/0.1"}});
  if(!response.ok) throw new Error(`GDELT unavailable (${response.status})`);
  const body=await response.json() as GdeltResponse;
  return (body.articles ?? []).filter(a=>a.title && a.url).map(a=>({title:a.title,url:a.url,source:a.domain ?? "GDELT",publishedAt:a.seendate ?? null,category:topic === "ai" ? "AI / ML" : "MOTORSPORT"}));
}
