export type UserRole = 'USER' | 'SUPER_ADMIN';

export type User = {
  id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  status: 'active' | 'banned' | 'deactivated';
  lastLoginAt?: Date | null;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  profile?: Profile;
  skills?: Skill[];
  categories?: Category[];
  guildMemberships?: GuildMembership[];
  contributions?: Contribution[];
};

export type Profile = {
  id: string;
  userId: string;
  profession?: string;
  country?: string;
  bio?: string;
  expertise?: string[];
  interests?: string[];
  availability?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
  status: 'registered' | 'reviewing' | 'approved' | 'active';
  createdAt: Date;
  updatedAt: Date;
  user?: User;
};

export type Skill = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  users?: User[];
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  users?: User[];
};

export type Guild = {
  id: string;
  name: string;
  description: string;
  purpose?: string;
  creatorId?: string | null;
  status: 'active' | 'archived';
  members?: GuildMembership[];
  projects?: Project[];
  discussions?: Discussion[];
  posts?: Post[];
  createdAt: Date;
  updatedAt: Date;
};

export type GuildMembership = {
  id: string;
  userId: string;
  guildId: string;
  role: 'member' | 'admin' | 'moderator';
  status: 'pending' | 'active';
  joinedAt: Date;
  user?: User;
  guild?: Guild;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  objectives?: string;
  status: 'investigation' | 'active' | 'completed' | 'on-hold';
  responsibilities?: {
    guildId: string;
    guildName: string;
    tasks?: Task[];
  }[];
  contributors?: User[];
  createdAt: Date;
  updatedAt: Date;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId: string;
  project?: Project;
  createdAt: Date;
  updatedAt: Date;
};

export type Discussion = {
  id: string;
  title: string;
  content: string;
  guildId?: string;
  authorId: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  guild?: Guild;
  author?: User;
  replies?: Reply[];
};

export type Reply = {
  id: string;
  content: string;
  discussionId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  discussion?: Discussion;
  author?: User;
};

export type Contribution = {
  id: string;
  userId: string;
  type: 'knowledge' | 'time' | 'experience' | 'programming' | 'research' | 'design' | 'contacts' | 'critique' | 'infrastructure' | 'advice' | 'capital';
  description: string;
  value?: string;
  status: 'pending' | 'accepted' | 'completed' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  user?: User;
};

export type Interest = {
  id: string;
  userId: string;
  categoryId: string;
  level: 'exploring' | 'interested' | 'expert' | 'teaching';
  createdAt: Date;
  user?: User;
  category?: Category;
};

export type AdminNote = {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  user?: User;
};

export type Conversation = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  participants?: ConversationParticipant[];
  messages?: Message[];
};

export type ConversationParticipant = {
  id: string;
  conversationId: string;
  userId: string;
  lastReadAt?: Date | null;
  createdAt: Date;
  conversation?: Conversation;
  user?: User;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt?: Date | null;
  createdAt: Date;
  conversation?: Conversation;
  sender?: User;
};

export type PostStatus = 'visible' | 'hidden' | 'blocked' | 'deleted';

export type Post = {
  id: string;
  authorId: string;
  guildId?: string | null;
  title?: string | null;
  content: string;
  status: PostStatus;
  createdAt: Date;
  updatedAt: Date;
  author?: User;
  guild?: Guild;
  comments?: Comment[];
  _count?: { comments: number };
};

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  parentId?: string | null;
  content: string;
  status: PostStatus;
  createdAt: Date;
  updatedAt: Date;
  post?: Post;
  author?: User;
  parent?: Comment;
  replies?: Comment[];
};

export type Notification = {
  id: string;
  userId: string;
  type: 'message' | 'post_reply' | 'comment_reply' | 'guild_request' | 'guild_approved' | 'system';
  title: string;
  content: string;
  link?: string | null;
  readAt?: Date | null;
  createdAt: Date;
  user?: User;
};

export type Report = {
  id: string;
  reportedById: string;
  postId?: string | null;
  commentId?: string | null;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: Date;
  reporter?: User;
  post?: Post;
  comment?: Comment;
};