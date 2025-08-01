import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import time

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, and_, desc, text
from sqlalchemy.orm import Session

from open_webui.models.users import Users, User
from open_webui.models.chats import Chats, Chat
from open_webui.models.files import Files, File
from open_webui.models.groups import Groups, Group
from open_webui.models.messages import Messages, Message
from open_webui.models.knowledge import Knowledge, KnowledgeModel
from open_webui.internal.db import get_db
from open_webui.utils.auth import get_admin_user
from open_webui.constants import ERROR_MESSAGES

log = logging.getLogger(__name__)

router = APIRouter()

############################
# Dashboard Models
############################

class UserStorageStats(BaseModel):
    user_id: str
    user_name: str
    user_email: str
    total_chats: int
    total_files: int
    total_images: int
    total_knowledge: int
    total_messages: int
    storage_usage_mb: float
    last_active: int

class ContentTypeStats(BaseModel):
    content_type: str
    count: int
    percentage: float
    total_size_mb: float

class GroupStats(BaseModel):
    group_id: str
    group_name: str
    member_count: int
    total_chats: int
    total_files: int
    total_images: int
    total_knowledge: int
    total_messages: int
    storage_usage_mb: float

class DashboardOverview(BaseModel):
    total_users: int
    active_users_7d: int
    active_users_30d: int
    total_chats: int
    total_files: int
    total_images: int
    total_knowledge: int
    total_messages: int
    total_storage_mb: float
    content_type_breakdown: List[ContentTypeStats]
    top_users_by_storage: List[UserStorageStats]
    top_groups_by_activity: List[GroupStats]

class TimeRangeStats(BaseModel):
    period: str
    chats_created: int
    files_uploaded: int
    images_generated: int
    messages_sent: int
    storage_used_mb: float

############################
# Dashboard Endpoints
############################

@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(user=Depends(get_admin_user)):
    """Get comprehensive dashboard overview statistics"""
    try:
        with get_db() as db:
            # Get basic counts
            total_users = Users.get_num_users()
            
            # Get active users (last 7 and 30 days)
            seven_days_ago = int(time.time()) - (7 * 24 * 60 * 60)
            thirty_days_ago = int(time.time()) - (30 * 24 * 60 * 60)
            
            # Get users with last_active_at >= threshold
            active_users_7d = db.query(User).filter(
                User.last_active_at >= seven_days_ago
            ).count()
            
            active_users_30d = db.query(User).filter(
                User.last_active_at >= thirty_days_ago
            ).count()
            
            # Get content counts
            total_chats = db.query(Chat).count()
            total_files = db.query(File).count()
            total_knowledge = db.query(Knowledge).count()
            total_messages = db.query(Message).count()
            
            # Count images (files with image content type)
            # Using a more compatible approach for JSON field queries
            total_images = 0
            files = db.query(File).all()
            for file in files:
                if file.meta and isinstance(file.meta, dict):
                    content_type = file.meta.get('content_type', '')
                    if content_type in ['image/png', 'image/jpeg', 'image/gif', 'image/webp']:
                        total_images += 1
            
            # Calculate storage usage - FIXED: Use same logic as content types endpoint
            total_storage_mb = 0
            
            # Calculate file storage
            files_storage_mb = 0
            for file in files:
                if file.meta and isinstance(file.meta, dict) and 'size' in file.meta:
                    files_storage_mb += file.meta['size'] / (1024 * 1024)  # Convert bytes to MB
            
            # Calculate storage for each type (same as content types endpoint)
            knowledge_storage_mb = total_knowledge * 1  # Estimate 1MB per knowledge base
            chats_storage_mb = total_chats * 0.1  # Estimate 0.1MB per chat
            messages_storage_mb = total_messages * 0.01  # Estimate 0.01MB per message
            
            # Total storage is sum of all types
            total_storage_mb = files_storage_mb + knowledge_storage_mb + chats_storage_mb + messages_storage_mb
            
            # Get content type breakdown with proper storage calculations
            content_types = [
                {"type": "chats", "count": total_chats, "storage": chats_storage_mb},
                {"type": "files", "count": total_files, "storage": files_storage_mb},
                {"type": "images", "count": total_images, "storage": files_storage_mb * 0.3},  # Estimate 30% of files are images
                {"type": "knowledge", "count": total_knowledge, "storage": knowledge_storage_mb},
                {"type": "messages", "count": total_messages, "storage": messages_storage_mb}
            ]
            
            total_content = sum(ct["count"] for ct in content_types)
            content_type_breakdown = []
            
            for ct in content_types:
                percentage = (ct["count"] / total_content * 100) if total_content > 0 else 0
                content_type_breakdown.append(ContentTypeStats(
                    content_type=ct["type"],
                    count=ct["count"],
                    percentage=round(percentage, 2),
                    total_size_mb=round(ct["storage"], 2)  # FIXED: Use actual calculated storage
                ))
            
            # Get top users by storage
            users = Users.get_users()
            user_stats = []
            
            for user_obj in users:
                user_chats = db.query(Chat).filter(Chat.user_id == user_obj.id).count()
                user_files = db.query(File).filter(File.user_id == user_obj.id).count()
                
                # Count user images
                user_images = 0
                user_file_list = db.query(File).filter(File.user_id == user_obj.id).all()
                for file in user_file_list:
                    if file.meta and isinstance(file.meta, dict):
                        content_type = file.meta.get('content_type', '')
                        if content_type in ['image/png', 'image/jpeg', 'image/gif', 'image/webp']:
                            user_images += 1
                
                user_knowledge = db.query(Knowledge).filter(Knowledge.user_id == user_obj.id).count()
                user_messages = db.query(Message).filter(Message.user_id == user_obj.id).count()
                
                # Calculate user storage - FIXED: Include all content types
                user_storage_mb = 0
                
                # File storage
                for file in user_file_list:
                    if file.meta and isinstance(file.meta, dict) and 'size' in file.meta:
                        user_storage_mb += file.meta['size'] / (1024 * 1024)
                
                # Add storage estimates for other content types (same as content types endpoint)
                user_storage_mb += user_knowledge * 1  # Estimate 1MB per knowledge base
                user_storage_mb += user_chats * 0.1  # Estimate 0.1MB per chat
                user_storage_mb += user_messages * 0.01  # Estimate 0.01MB per message
                
                user_stats.append(UserStorageStats(
                    user_id=user_obj.id,
                    user_name=user_obj.name,
                    user_email=user_obj.email,
                    total_chats=user_chats,
                    total_files=user_files,
                    total_images=user_images,
                    total_knowledge=user_knowledge,
                    total_messages=user_messages,
                    storage_usage_mb=round(user_storage_mb, 2),
                    last_active=user_obj.last_active_at
                ))
            
            # Sort users by storage usage
            user_stats.sort(key=lambda x: x.storage_usage_mb, reverse=True)
            top_users_by_storage = user_stats[:10]
            
            # Get top groups by activity
            groups = Groups.get_groups()
            group_stats = []
            
            for group in groups:
                member_count = len(group.user_ids) if group.user_ids else 0
                group_chats = 0
                group_files = 0
                group_images = 0
                group_knowledge = 0
                group_messages = 0
                group_storage_mb = 0
                
                if group.user_ids:
                    for user_id in group.user_ids:
                        user_chats = db.query(Chat).filter(Chat.user_id == user_id).count()
                        user_files = db.query(File).filter(File.user_id == user_id).count()
                        
                        # Count user images
                        user_file_list = db.query(File).filter(File.user_id == user_id).all()
                        user_images_count = 0
                        for file in user_file_list:
                            if file.meta and isinstance(file.meta, dict):
                                content_type = file.meta.get('content_type', '')
                                if content_type in ['image/png', 'image/jpeg', 'image/gif', 'image/webp']:
                                    user_images_count += 1
                        
                        user_knowledge = db.query(Knowledge).filter(Knowledge.user_id == user_id).count()
                        user_messages = db.query(Message).filter(Message.user_id == user_id).count()
                        
                        group_chats += user_chats
                        group_files += user_files
                        group_images += user_images_count
                        group_knowledge += user_knowledge
                        group_messages += user_messages
                        
                        # Calculate group storage - FIXED: Include all content types
                        for file in user_file_list:
                            if file.meta and isinstance(file.meta, dict) and 'size' in file.meta:
                                group_storage_mb += file.meta['size'] / (1024 * 1024)
                        
                        # Add storage estimates for other content types
                        group_storage_mb += user_knowledge * 1  # Estimate 1MB per knowledge base
                        group_storage_mb += user_chats * 0.1  # Estimate 0.1MB per chat
                        group_storage_mb += user_messages * 0.01  # Estimate 0.01MB per message
                
                group_stats.append(GroupStats(
                    group_id=group.id,
                    group_name=group.name,
                    member_count=member_count,
                    total_chats=group_chats,
                    total_files=group_files,
                    total_images=group_images,
                    total_knowledge=group_knowledge,
                    total_messages=group_messages,
                    storage_usage_mb=round(group_storage_mb, 2)
                ))
            
            # Sort groups by total activity (chats + files + images + knowledge)
            group_stats.sort(key=lambda x: x.total_chats + x.total_files + x.total_images + x.total_knowledge, reverse=True)
            top_groups_by_activity = group_stats[:10]
            
            return DashboardOverview(
                total_users=total_users,
                active_users_7d=active_users_7d,
                active_users_30d=active_users_30d,
                total_chats=total_chats,
                total_files=total_files,
                total_images=total_images,
                total_knowledge=total_knowledge,
                total_messages=total_messages,
                total_storage_mb=round(total_storage_mb, 2),  # FIXED: Now includes all storage types
                content_type_breakdown=content_type_breakdown,
                top_users_by_storage=top_users_by_storage,
                top_groups_by_activity=top_groups_by_activity
            )
            
    except Exception as e:
        log.error(f"Error getting dashboard overview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get dashboard overview"
        )

@router.get("/users/storage", response_model=List[UserStorageStats])
async def get_users_storage_stats(
    limit: Optional[int] = 50,
    user=Depends(get_admin_user)
):
    """Get storage usage statistics for all users"""
    try:
        with get_db() as db:
            users = Users.get_users(limit=limit)
            user_stats = []
            
            for user_obj in users:
                user_chats = db.query(Chat).filter(Chat.user_id == user_obj.id).count()
                user_files = db.query(File).filter(File.user_id == user_obj.id).count()
                
                # Count user images
                user_images = 0
                user_file_list = db.query(File).filter(File.user_id == user_obj.id).all()
                for file in user_file_list:
                    if file.meta and isinstance(file.meta, dict):
                        content_type = file.meta.get('content_type', '')
                        if content_type in ['image/png', 'image/jpeg', 'image/gif', 'image/webp']:
                            user_images += 1
                
                user_knowledge = db.query(Knowledge).filter(Knowledge.user_id == user_obj.id).count()
                user_messages = db.query(Message).filter(Message.user_id == user_obj.id).count()
                
                # Calculate user storage - FIXED: Include all content types
                user_storage_mb = 0
                
                # File storage
                for file in user_file_list:
                    if file.meta and isinstance(file.meta, dict) and 'size' in file.meta:
                        user_storage_mb += file.meta['size'] / (1024 * 1024)
                
                # Add storage estimates for other content types (same as content types endpoint)
                user_storage_mb += user_knowledge * 1  # Estimate 1MB per knowledge base
                user_storage_mb += user_chats * 0.1  # Estimate 0.1MB per chat
                user_storage_mb += user_messages * 0.01  # Estimate 0.01MB per message
                
                user_stats.append(UserStorageStats(
                    user_id=user_obj.id,
                    user_name=user_obj.name,
                    user_email=user_obj.email,
                    total_chats=user_chats,
                    total_files=user_files,
                    total_images=user_images,
                    total_knowledge=user_knowledge,
                    total_messages=user_messages,
                    storage_usage_mb=round(user_storage_mb, 2),
                    last_active=user_obj.last_active_at
                ))
            
            # Sort by storage usage
            user_stats.sort(key=lambda x: x.storage_usage_mb, reverse=True)
            return user_stats
            
    except Exception as e:
        log.error(f"Error getting users storage stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get users storage statistics"
        )

@router.get("/groups/activity", response_model=List[GroupStats])
async def get_groups_activity_stats(
    limit: Optional[int] = 50,
    user=Depends(get_admin_user)
):
    """Get activity statistics for all groups"""
    try:
        with get_db() as db:
            groups = Groups.get_groups()
            group_stats = []
            
            for group in groups:
                member_count = len(group.user_ids) if group.user_ids else 0
                group_chats = 0
                group_files = 0
                group_images = 0
                group_knowledge = 0
                group_messages = 0
                group_storage_mb = 0
                
                if group.user_ids:
                    for user_id in group.user_ids:
                        user_chats = db.query(Chat).filter(Chat.user_id == user_id).count()
                        user_files = db.query(File).filter(File.user_id == user_id).count()
                        
                        # Count user images
                        user_file_list = db.query(File).filter(File.user_id == user_id).all()
                        user_images_count = 0
                        for file in user_file_list:
                            if file.meta and isinstance(file.meta, dict):
                                content_type = file.meta.get('content_type', '')
                                if content_type in ['image/png', 'image/jpeg', 'image/gif', 'image/webp']:
                                    user_images_count += 1
                        
                        user_knowledge = db.query(Knowledge).filter(Knowledge.user_id == user_id).count()
                        user_messages = db.query(Message).filter(Message.user_id == user_id).count()
                        
                        group_chats += user_chats
                        group_files += user_files
                        group_images += user_images_count
                        group_knowledge += user_knowledge
                        group_messages += user_messages
                        
                        # Calculate group storage - FIXED: Include all content types
                        for file in user_file_list:
                            if file.meta and isinstance(file.meta, dict) and 'size' in file.meta:
                                group_storage_mb += file.meta['size'] / (1024 * 1024)
                        
                        # Add storage estimates for other content types
                        group_storage_mb += user_knowledge * 1  # Estimate 1MB per knowledge base
                        group_storage_mb += user_chats * 0.1  # Estimate 0.1MB per chat
                        group_storage_mb += user_messages * 0.01  # Estimate 0.01MB per message
                
                group_stats.append(GroupStats(
                    group_id=group.id,
                    group_name=group.name,
                    member_count=member_count,
                    total_chats=group_chats,
                    total_files=group_files,
                    total_images=group_images,
                    total_knowledge=group_knowledge,
                    total_messages=group_messages,
                    storage_usage_mb=round(group_storage_mb, 2)
                ))
            
            # Sort by total activity
            group_stats.sort(key=lambda x: x.total_chats + x.total_files + x.total_images + x.total_knowledge, reverse=True)
            return group_stats[:limit] if limit else group_stats
            
    except Exception as e:
        log.error(f"Error getting groups activity stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get groups activity statistics"
        )

@router.get("/content/types", response_model=List[ContentTypeStats])
async def get_content_type_statistics(user=Depends(get_admin_user)):
    """Get detailed content type statistics"""
    try:
        with get_db() as db:
            # Get counts
            total_chats = db.query(Chat).count()
            total_files = db.query(File).count()
            total_knowledge = db.query(Knowledge).count()
            total_messages = db.query(Message).count()
            
            # Count images (files with image content type)
            total_images = 0
            files_list = db.query(File).all()
            for file in files_list:
                if file.meta and isinstance(file.meta, dict):
                    content_type = file.meta.get('content_type', '')
                    if content_type in ['image/png', 'image/jpeg', 'image/gif', 'image/webp']:
                        total_images += 1
            
            # Calculate storage for each type
            files_storage_mb = 0
            for file in files_list:
                if file.meta and isinstance(file.meta, dict) and 'size' in file.meta:
                    files_storage_mb += file.meta['size'] / (1024 * 1024)
            
            knowledge_storage_mb = total_knowledge * 1  # Estimate 1MB per knowledge base
            chats_storage_mb = total_chats * 0.1  # Estimate 0.1MB per chat
            messages_storage_mb = total_messages * 0.01  # Estimate 0.01MB per message
            
            content_types = [
                {"type": "chats", "count": total_chats, "storage": chats_storage_mb},
                {"type": "files", "count": total_files, "storage": files_storage_mb},
                {"type": "images", "count": total_images, "storage": files_storage_mb * 0.3},  # Estimate 30% of files are images
                {"type": "knowledge", "count": total_knowledge, "storage": knowledge_storage_mb},
                {"type": "messages", "count": total_messages, "storage": messages_storage_mb}
            ]
            
            total_content = sum(ct["count"] for ct in content_types)
            content_type_stats = []
            
            for ct in content_types:
                percentage = (ct["count"] / total_content * 100) if total_content > 0 else 0
                content_type_stats.append(ContentTypeStats(
                    content_type=ct["type"],
                    count=ct["count"],
                    percentage=round(percentage, 2),
                    total_size_mb=round(ct["storage"], 2)
                ))
            
            return content_type_stats
            
    except Exception as e:
        log.error(f"Error getting content type statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get content type statistics"
        )

@router.get("/time-series", response_model=List[TimeRangeStats])
async def get_time_series_statistics(
    period: str = "7d",  # 7d, 30d, 90d
    user=Depends(get_admin_user)
):
    """Get time series statistics for content generation"""
    try:
        with get_db() as db:
            now = int(time.time())
            
            if period == "7d":
                days = 7
            elif period == "30d":
                days = 30
            elif period == "90d":
                days = 90
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid period. Use 7d, 30d, or 90d"
                )
            
            start_time = now - (days * 24 * 60 * 60)
            time_series_data = []
            
            # Debug: Check total counts
            total_chats = db.query(Chat).count()
            total_files = db.query(File).count()
            total_messages = db.query(Message).count()
            total_knowledge = db.query(Knowledge).count()
            
            log.info(f"Total counts - Chats: {total_chats}, Files: {total_files}, Messages: {total_messages}, Knowledge: {total_knowledge}")
            
            # Debug: Check some message timestamps
            sample_messages = db.query(Message).limit(5).all()
            for msg in sample_messages:
                log.info(f"Message {msg.id}: created_at = {msg.created_at} (type: {type(msg.created_at)})")
            
            for i in range(days):
                period_start = start_time + (i * 24 * 60 * 60)
                period_end = period_start + (24 * 60 * 60)
                
                # Count content created in this period
                chats_created = db.query(Chat).filter(
                    and_(Chat.created_at >= period_start, Chat.created_at < period_end)
                ).count()
                
                files_uploaded = db.query(File).filter(
                    and_(File.created_at >= period_start, File.created_at < period_end)
                ).count()
                
                # Count images generated in this period
                images_generated = 0
                period_files = db.query(File).filter(
                    and_(File.created_at >= period_start, File.created_at < period_end)
                ).all()
                for file in period_files:
                    if file.meta and isinstance(file.meta, dict):
                        content_type = file.meta.get('content_type', '')
                        if content_type in ['image/png', 'image/jpeg', 'image/gif', 'image/webp']:
                            images_generated += 1
                
                knowledge_created = db.query(Knowledge).filter(
                    and_(Knowledge.created_at >= period_start, Knowledge.created_at < period_end)
                ).count()
                
                # FIXED: Messages use nanoseconds, so convert our time range to nanoseconds
                period_start_ns = period_start * 1_000_000_000  # Convert seconds to nanoseconds
                period_end_ns = period_end * 1_000_000_000      # Convert seconds to nanoseconds
                
                messages_sent = db.query(Message).filter(
                    and_(Message.created_at >= period_start_ns, Message.created_at < period_end_ns)
                ).count()
                
                # Debug: Log the first few days to see what's happening
                if i < 3:
                    log.info(f"Period {datetime.fromtimestamp(period_start).strftime('%Y-%m-%d')}: "
                           f"chats={chats_created}, files={files_uploaded}, messages={messages_sent}, "
                           f"period_start_ns={period_start_ns}, period_end_ns={period_end_ns}")
                
                # Calculate storage for this period - FIXED: Include all content types
                storage_used_mb = 0
                
                # File storage
                for file in period_files:
                    if file.meta and isinstance(file.meta, dict) and 'size' in file.meta:
                        storage_used_mb += file.meta['size'] / (1024 * 1024)
                
                # Add storage estimates for other content types (same as other endpoints)
                storage_used_mb += knowledge_created * 1  # Estimate 1MB per knowledge base
                storage_used_mb += chats_created * 0.1  # Estimate 0.1MB per chat
                storage_used_mb += messages_sent * 0.01  # Estimate 0.01MB per message
                
                time_series_data.append(TimeRangeStats(
                    period=datetime.fromtimestamp(period_start).strftime("%Y-%m-%d"),
                    chats_created=chats_created,
                    files_uploaded=files_uploaded,
                    images_generated=images_generated,
                    messages_sent=messages_sent,
                    storage_used_mb=round(storage_used_mb, 2)
                ))
            
            return time_series_data
            
    except Exception as e:
        log.error(f"Error getting time series statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get time series statistics"
        ) 