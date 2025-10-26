import { useSuiClientQuery } from "@mysten/dapp-kit";
import { useSearchParams } from "react-router-dom";

export default function ProfileView() {
  const [params] = useSearchParams();
  const objectId = params.get("object");

  const { data, isLoading } = useSuiClientQuery("getObject", {
    id: objectId || "",
    options: { showContent: true },
  });

  if (isLoading) return <p>Loading...</p>;

  const content = data?.data?.content;
  const fields = content && 'fields' in content ? (content.fields as any) : null;
  if (!fields) return <p>Profil bulunamadı.</p>;

  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px" }}>
      <h2>{fields.name as string}</h2>
      <p>{fields.bio as string}</p>
      <img
        src={`https://ipfs.io/ipfs/${fields.avatar_cid as string}`}
        alt="avatar"
        width="120"
        style={{ borderRadius: "50%" }}
      />
      <p>Tema: {fields.theme as string}</p>
    </div>
  );
}
