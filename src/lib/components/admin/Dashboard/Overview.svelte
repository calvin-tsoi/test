<script lang="ts">
	import { getContext } from 'svelte';
	import type { DashboardOverview } from '$lib/apis/dashboard';
	import dayjs from 'dayjs';

	const i18n = getContext('i18n');

	export let overview: DashboardOverview;

	const formatStorage = (mb: number) => {
		if (mb >= 1024) {
			return `${(mb / 1024).toFixed(2)} GB`;
		}
		return `${mb.toFixed(2)} MB`;
	};

	const formatDate = (timestamp: number) => {
		return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm');
	};
</script>

<div class="space-y-6">
	<!-- Overview Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
			<div class="flex items-center">
				<div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
					<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-600 dark:text-gray-400">{$i18n.t('Total Users')}</p>
					<p class="text-2xl font-semibold text-gray-900 dark:text-white">{overview.total_users}</p>
				</div>
			</div>
		</div>

		<div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
			<div class="flex items-center">
				<div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
					<svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-600 dark:text-gray-400">{$i18n.t('Active Users (7d)')}</p>
					<p class="text-2xl font-semibold text-gray-900 dark:text-white">{overview.active_users_7d}</p>
				</div>
			</div>
		</div>

		<div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
			<div class="flex items-center">
				<div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
					<svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-600 dark:text-gray-400">{$i18n.t('Total Storage')}</p>
					<p class="text-2xl font-semibold text-gray-900 dark:text-white">{formatStorage(overview.total_storage_mb)}</p>
				</div>
			</div>
		</div>

		<div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
			<div class="flex items-center">
				<div class="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
					<svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-600 dark:text-gray-400">{$i18n.t('Total Chats')}</p>
					<p class="text-2xl font-semibold text-gray-900 dark:text-white">{overview.total_chats}</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Content Statistics -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Content Type Breakdown -->
		<div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{$i18n.t('Content Type Breakdown')}</h3>
			<div class="space-y-3">
				{#each overview.content_type_breakdown as content}
					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<div class="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
							<span class="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{content.content_type}</span>
						</div>
						<div class="text-right">
							<div class="text-sm font-semibold text-gray-900 dark:text-white">{content.count.toLocaleString()}</div>
							<div class="text-xs text-gray-500">{content.percentage.toFixed(1)}%</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Top Users by Storage -->
		<div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{$i18n.t('Top Users by Storage')}</h3>
			<div class="space-y-3">
				{#each overview.top_users_by_storage as user, index}
					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300 mr-3">
								{index + 1}
							</div>
							<div>
								<div class="text-sm font-medium text-gray-900 dark:text-white">{user.user_name}</div>
								<div class="text-xs text-gray-500">{user.user_email}</div>
							</div>
						</div>
						<div class="text-right">
							<div class="text-sm font-semibold text-gray-900 dark:text-white">{formatStorage(user.storage_usage_mb)}</div>
							<div class="text-xs text-gray-500">{user.total_chats} chats, {user.total_files} files</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Top Groups by Activity -->
	<div class="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
		<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{$i18n.t('Top Groups by Activity')}</h3>
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
				<thead class="bg-gray-50 dark:bg-gray-800">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Group')}</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Members')}</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Chats')}</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Files')}</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Images')}</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Knowledge')}</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Storage')}</th>
					</tr>
				</thead>
				<tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
					{#each overview.top_groups_by_activity as group}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{group.group_name}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{group.member_count}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{group.total_chats}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{group.total_files}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{group.total_images}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{group.total_knowledge}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatStorage(group.storage_usage_mb)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div> 