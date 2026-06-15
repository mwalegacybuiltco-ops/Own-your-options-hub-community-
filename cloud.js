const config = {
  url: "https://tuhxctvpljfqgakfspjb.supabase.co",
  anonKey: "sb_publishable_a18abo02gPh5mmDt_lZ2Wg_wSiUpKL2"
};
const sessionKey = "oyo-cloud-session";

const getSession = () => {
  try { return JSON.parse(localStorage.getItem(sessionKey) || "null"); }
  catch { localStorage.removeItem(sessionKey); return null; }
};
const signOut = () => localStorage.removeItem(sessionKey);

async function request(path, options = {}, authenticated = true) {
  const session = getSession();
  const response = await fetch(`${config.url}${path}`, {
    ...options,
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${authenticated && session?.access_token ? session.access_token : config.anonKey}`,
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error_description || error.msg || "Cloud request failed");
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function signIn(email, password) {
  const session = await request("/auth/v1/token?grant_type=password", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password })
  }, false);
  localStorage.setItem(sessionKey, JSON.stringify(session));
  return session;
}
async function signUp(email, password, name) {
  return request("/auth/v1/signup", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, data: { name } })
  }, false);
}
async function getHubAccessRole() {
  const session = getSession();
  if (!session?.user?.id) return "Guest";
  const owner = await request(`/rest/v1/oyo_app_owner?user_id=eq.${session.user.id}&select=user_id`);
  if (owner?.length) return "Owner";
  const membership = await request(`/rest/v1/oyo_memberships?user_id=eq.${session.user.id}&select=status`);
  if (membership?.[0]?.status && membership[0].status !== "Active") return "Blocked";
  const moderator = await request(`/rest/v1/oyo_staff_roles?user_id=eq.${session.user.id}&status=eq.Active&select=role`);
  return moderator?.length ? "Moderator" : "Member";
}
const fetchHubContent = () => request("/rest/v1/oyo_hub_content?select=*&order=created_at.desc");
const fetchProfiles = () => request("/rest/v1/oyo_member_profiles?select=*&order=display_name.asc");
const fetchMemberships = () => request("/rest/v1/oyo_memberships?select=*&order=joined_at.desc");
const fetchStaffRoles = () => request("/rest/v1/oyo_staff_roles?select=*");
const fetchProgress = () => request("/rest/v1/oyo_member_progress?select=*");
const fetchPosts = () => request("/rest/v1/oyo_community_posts?select=*&order=created_at.desc");
const fetchComments = () => request("/rest/v1/oyo_community_comments?select=*&order=created_at.asc");

const createPost = post => request("/rest/v1/oyo_community_posts", { method:"POST", headers:{"Content-Type":"application/json",Prefer:"return=representation"}, body:JSON.stringify(post) });
const createCloudComment = comment => request("/rest/v1/oyo_community_comments", { method:"POST", headers:{"Content-Type":"application/json",Prefer:"return=representation"}, body:JSON.stringify(comment) });
const removeCloudPost = id => request(`/rest/v1/oyo_community_posts?id=eq.${id}`, { method:"DELETE" });
const removeCloudComment = id => request(`/rest/v1/oyo_community_comments?id=eq.${id}`, { method:"DELETE" });
const upsertHubContent = item => request("/rest/v1/oyo_hub_content?on_conflict=id", { method:"POST", headers:{"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=representation"}, body:JSON.stringify(item) });
const removeHubContent = id => request(`/rest/v1/oyo_hub_content?id=eq.${id}`, { method:"DELETE" });
const upsertProgress = item => request("/rest/v1/oyo_member_progress?on_conflict=user_id,content_id", { method:"POST",headers:{"Content-Type":"application/json",Prefer:"resolution=merge-duplicates"},body:JSON.stringify(item) });
const updateProfile = (userId, changes) => request(`/rest/v1/oyo_member_profiles?user_id=eq.${userId}`, { method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(changes) });
const updateMembership = (userId, changes) => request(`/rest/v1/oyo_memberships?user_id=eq.${userId}`, { method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(changes) });
const setMemberAccess = (userId,status,reason="") => request("/rest/v1/rpc/oyo_set_member_access", { method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({target_user_id:userId,new_status:status,reason}) });
const permanentlyDeleteMember = userId => request("/rest/v1/rpc/oyo_permanently_delete_member", { method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({target_user_id:userId}) });
const assignModerator = (userId, active=true) => active
  ? request("/rest/v1/oyo_staff_roles?on_conflict=user_id",{method:"POST",headers:{"Content-Type":"application/json",Prefer:"resolution=merge-duplicates"},body:JSON.stringify({user_id:userId,role:"moderator",status:"Active",assigned_by:getSession().user.id})})
  : request(`/rest/v1/oyo_staff_roles?user_id=eq.${userId}`,{method:"DELETE"});

globalThis.OYOCloud = {
  getSession, signOut, signIn, signUp, getHubAccessRole, fetchHubContent,
  fetchProfiles, fetchMemberships, fetchStaffRoles, fetchProgress, fetchPosts,
  fetchComments, createPost, createCloudComment, removeCloudPost,
  removeCloudComment, upsertHubContent, removeHubContent, upsertProgress,
  updateProfile, updateMembership, setMemberAccess, permanentlyDeleteMember,
  assignModerator
};
