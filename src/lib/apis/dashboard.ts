import { WEBUI_API_BASE_URL } from '$lib/constants';

export interface UserStorageStats {
	user_id: string;
	user_name: string;
	user_email: string;
	total_chats: number;
	total_files: number;
	total_images: number;
	total_knowledge: number;
	total_messages: number;
	storage_usage_mb: number;
	last_active: number;
}

export interface ContentTypeStats {
	content_type: string;
	count: number;
	percentage: number;
	total_size_mb: number;
}

export interface GroupStats {
	group_id: string;
	group_name: string;
	member_count: number;
	total_chats: number;
	total_files: number;
	total_images: number;
	total_knowledge: number;
	total_messages: number;
	storage_usage_mb: number;
}

export interface DashboardOverview {
	total_users: number;
	active_users_7d: number;
	active_users_30d: number;
	total_chats: number;
	total_files: number;
	total_images: number;
	total_knowledge: number;
	total_messages: number;
	total_storage_mb: number;
	content_type_breakdown: ContentTypeStats[];
	top_users_by_storage: UserStorageStats[];
	top_groups_by_activity: GroupStats[];
}

export interface TimeRangeStats {
	period: string;
	chats_created: number;
	files_uploaded: number;
	images_generated: number;
	messages_sent: number;
	storage_used_mb: number;
}

export const getDashboardOverview = async (token: string): Promise<DashboardOverview> => {
	const response = await fetch(`${WEBUI_API_BASE_URL}/dashboard/overview`, {
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		}
	});

	if (!response.ok) {
		throw new Error('Failed to fetch dashboard overview');
	}

	return response.json();
};

export const getUsersStorageStats = async (token: string, limit?: number): Promise<UserStorageStats[]> => {
	const params = new URLSearchParams();
	if (limit) params.append('limit', limit.toString());

	const response = await fetch(`${WEBUI_API_BASE_URL}/dashboard/users/storage?${params}`, {
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		}
	});

	if (!response.ok) {
		throw new Error('Failed to fetch users storage stats');
	}

	return response.json();
};

export const getGroupsActivityStats = async (token: string, limit?: number): Promise<GroupStats[]> => {
	const params = new URLSearchParams();
	if (limit) params.append('limit', limit.toString());

	const response = await fetch(`${WEBUI_API_BASE_URL}/dashboard/groups/activity?${params}`, {
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		}
	});

	if (!response.ok) {
		throw new Error('Failed to fetch groups activity stats');
	}

	return response.json();
};

export const getContentTypeStats = async (token: string): Promise<ContentTypeStats[]> => {
	const response = await fetch(`${WEBUI_API_BASE_URL}/dashboard/content/types`, {
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		}
	});

	if (!response.ok) {
		throw new Error('Failed to fetch content type stats');
	}

	return response.json();
};

export const getTimeSeriesStats = async (token: string, period: string = '7d'): Promise<TimeRangeStats[]> => {
	const response = await fetch(`${WEBUI_API_BASE_URL}/dashboard/time-series?period=${period}`, {
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		}
	});

	if (!response.ok) {
		throw new Error('Failed to fetch time series stats');
	}

	return response.json();
}; 