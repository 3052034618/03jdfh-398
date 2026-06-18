import { useState } from 'react';
import { useBlueprintStore } from '@/store/useBlueprintStore';
import { Send, Reply, User } from 'lucide-react';
import type { Comment } from '@/types';

interface CommentsProps {
  roomId: string | null;
}

const roleColors: Record<string, string> = {
  '项目负责人': 'bg-red-500/20 text-red-400 border-red-500/30',
  '编剧': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  '关卡策划': 'bg-green-500/20 text-green-400 border-green-500/30',
  '音效师': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const { addComment } = useBlueprintStore();

  const handleReply = () => {
    if (!replyContent.trim()) return;
    addComment(comment.roomId, {
      author: '当前用户',
      role: '项目负责人',
      avatar: '👤',
      content: replyContent.trim(),
    });
    setReplyContent('');
    setShowReply(false);
  };

  const colorClass = roleColors[comment.role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  return (
    <div className={`${depth > 0 ? 'ml-8 pl-3 border-l border-horror-border' : ''}`}>
      <div className="horror-card p-3 mb-2 animate-fade-in">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-horror-surface2 flex items-center justify-center text-base shrink-0">
            {comment.avatar || <User size={14} className="text-horror-muted" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm text-white font-medium">{comment.author}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${colorClass}`}>
                {comment.role}
              </span>
              <span className="text-[10px] text-horror-muted">{comment.timestamp}</span>
            </div>
            <p className="text-sm text-horror-text leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            <button
              onClick={() => setShowReply(!showReply)}
              className="mt-2 text-xs text-horror-muted hover:text-horror-accent flex items-center gap-1 transition-colors"
            >
              <Reply size={10} /> 回复
            </button>
            {showReply && (
              <div className="mt-2 flex gap-2 animate-fade-in">
                <input
                  className="horror-input text-xs py-1.5 flex-1"
                  placeholder="输入回复内容..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                  autoFocus
                />
                <button
                  onClick={handleReply}
                  className="horror-btn-primary text-xs py-1 px-2 flex items-center gap-1"
                >
                  <Send size={10} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {comment.replies?.map((reply) => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </div>
  );
};

const Comments = ({ roomId }: CommentsProps) => {
  const { comments, addComment } = useBlueprintStore();
  const [newComment, setNewComment] = useState('');

  const roomComments = roomId ? comments.filter((c) => c.roomId === roomId) : [];

  const handleSend = () => {
    if (!roomId || !newComment.trim()) return;
    addComment(roomId, {
      author: '当前用户',
      role: '项目负责人',
      avatar: '👤',
      content: newComment.trim(),
    });
    setNewComment('');
  };

  if (!roomId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-horror-muted text-sm">
        请先选择一个房间区域查看评论
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-2 space-y-1">
        {roomComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-horror-muted text-sm">
            暂无评论，来发起第一个讨论吧
          </div>
        ) : (
          roomComments.map((c) => <CommentItem key={c.id} comment={c} />)
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-horror-border flex gap-2">
        <input
          className="horror-input text-sm"
          placeholder={`针对此区域发表评论... (Enter发送)`}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          className="horror-btn-primary px-3 flex items-center gap-1"
          disabled={!newComment.trim()}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
};

export default Comments;
