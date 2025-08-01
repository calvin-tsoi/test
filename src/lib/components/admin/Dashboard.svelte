<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import {
		getDashboardOverview,
		getUsersStorageStats,
		getGroupsActivityStats,
		getContentTypeStats,
		getTimeSeriesStats,
		type DashboardOverview,
		type UserStorageStats,
		type GroupStats,
		type ContentTypeStats,
		type TimeRangeStats
	} from '$lib/apis/dashboard';

	import Overview from './Dashboard/Overview.svelte';
	import UserStorage from './Dashboard/UserStorage.svelte';
	import GroupActivity from './Dashboard/GroupActivity.svelte';
	import ContentTypes from './Dashboard/ContentTypes.svelte';
	import TimeSeries from './Dashboard/TimeSeries.svelte';

	const i18n = getContext('i18n');

	let selectedTab = 'overview';
	let loaded = false;

	let overview: DashboardOverview | null = null;
	let userStats: UserStorageStats[] = [];
	let groupStats: GroupStats[] = [];
	let contentTypeStats: ContentTypeStats[] = [];
	let timeSeriesStats: TimeRangeStats[] = [];

	const loadData = async () => {
		try {
			overview = await getDashboardOverview(localStorage.token);
			userStats = await getUsersStorageStats(localStorage.token);
			groupStats = await getGroupsActivityStats(localStorage.token);
			contentTypeStats = await getContentTypeStats(localStorage.token);
			timeSeriesStats = await getTimeSeriesStats(localStorage.token, '7d');
		} catch (error) {
			toast.error($i18n.t('Failed to load dashboard data'));
			console.error('Dashboard data loading error:', error);
		}
	};

	onMount(async () => {
		await loadData();
		loaded = true;

		const containerElement = document.getElementById('dashboard-tabs-container');

		if (containerElement) {
			containerElement.addEventListener('wheel', function (event) {
				if (event.deltaY !== 0) {
					containerElement.scrollLeft += event.deltaY;
				}
			});
		}
	});
</script>

{#if loaded}
	<div class="flex flex-col h-full">
		<div class="flex flex-col lg:flex-row gap-1">
			<div
				id="dashboard-tabs-container"
				class="flex gap-1 scrollbar-none overflow-x-auto w-fit text-center text-sm font-medium rounded-full bg-transparent pt-1"
			>
				<button
					class="min-w-fit rounded-full p-1.5 {selectedTab === 'overview'
						? ''
						: 'text-gray-300 dark:text-gray-600 hover:text-gray-700 dark:hover:text-white'} transition"
					on:click={() => (selectedTab = 'overview')}
				>
					<div class="flex items-center gap-2">
						<div class="self-center mr-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 16 16"
								fill="currentColor"
								class="size-4"
							>
								<path
									fill-rule="evenodd"
									d="M2.5 4A1.5 1.5 0 0 0 1 5.5v3A1.5 1.5 0 0 0 2.5 10h3A1.5 1.5 0 0 0 7 8.5v-3A1.5 1.5 0 0 0 5.5 4h-3Zm7 0A1.5 1.5 0 0 0 8 5.5v3A1.5 1.5 0 0 0 9.5 10h3A1.5 1.5 0 0 0 14 8.5v-3A1.5 1.5 0 0 0 12.5 4h-3ZM2.5 11A1.5 1.5 0 0 0 1 12.5v1A1.5 1.5 0 0 0 2.5 15h3A1.5 1.5 0 0 0 7 13.5v-1A1.5 1.5 0 0 0 5.5 11h-3Zm7 0A1.5 1.5 0 0 0 8 12.5v1A1.5 1.5 0 0 0 9.5 15h3A1.5 1.5 0 0 0 14 13.5v-1A1.5 1.5 0 0 0 12.5 11h-3Z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="self-center">{$i18n.t('Overview')}</div>
					</div>
				</button>

				<button
					class="min-w-fit rounded-full p-1.5 {selectedTab === 'user-storage'
						? ''
						: 'text-gray-300 dark:text-gray-600 hover:text-gray-700 dark:hover:text-white'} transition"
					on:click={() => (selectedTab = 'user-storage')}
				>
					<div class="flex items-center gap-2">
						<div class="self-center mr-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 16 16"
								fill="currentColor"
								class="size-4"
							>
								<path
									fill-rule="evenodd"
									d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.93 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.993 6.993 0 0 1 7.51 3.456l.33-1.652ZM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="self-center">{$i18n.t('User Storage')}</div>
					</div>
				</button>

				<button
					class="min-w-fit rounded-full p-1.5 {selectedTab === 'group-activity'
						? ''
						: 'text-gray-300 dark:text-gray-600 hover:text-gray-700 dark:hover:text-white'} transition"
					on:click={() => (selectedTab = 'group-activity')}
				>
					<div class="flex items-center gap-2">
						<div class="self-center mr-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 16 16"
								fill="currentColor"
								class="size-4"
							>
								<path
									fill-rule="evenodd"
									d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm-3.646-4.646a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L4.5 9.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4Z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="self-center">{$i18n.t('Group Activity')}</div>
					</div>
				</button>

				<button
					class="min-w-fit rounded-full p-1.5 {selectedTab === 'content-types'
						? ''
						: 'text-gray-300 dark:text-gray-600 hover:text-gray-700 dark:hover:text-white'} transition"
					on:click={() => (selectedTab = 'content-types')}
				>
					<div class="flex items-center gap-2">
						<div class="self-center mr-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 16 16"
								fill="currentColor"
								class="size-4"
							>
								<path
									fill-rule="evenodd"
									d="M2.5 3a.5.5 0 0 0 0 1h11a.5.5 0 0 0 0-1h-11Zm0 3a.5.5 0 0 0 0 1h11a.5.5 0 0 0 0-1h-11Zm0 3a.5.5 0 0 0 0 1h11a.5.5 0 0 0 0-1h-11Zm0 3a.5.5 0 0 0 0 1h11a.5.5 0 0 0 0-1h-11Z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="self-center">{$i18n.t('Content Types')}</div>
					</div>
				</button>

				<button
					class="min-w-fit rounded-full p-1.5 {selectedTab === 'time-series'
						? ''
						: 'text-gray-300 dark:text-gray-600 hover:text-gray-700 dark:hover:text-white'} transition"
					on:click={() => (selectedTab = 'time-series')}
				>
					<div class="flex items-center gap-2">
						<div class="self-center mr-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 16 16"
								fill="currentColor"
								class="size-4"
							>
								<path
									fill-rule="evenodd"
									d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4.414a1 1 0 0 0-.707.293L.854 15.146A.5.5 0 0 1 0 14.793V2Zm5 4a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Zm4 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Zm3 .5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="self-center">{$i18n.t('Time Series')}</div>
					</div>
				</button>
			</div>
		</div>

		<div class="flex-1 mt-1 lg:mt-0 overflow-y-scroll">
			{#if selectedTab === 'overview' && overview}
				<Overview {overview} />
			{:else if selectedTab === 'user-storage'}
				<UserStorage {userStats} />
			{:else if selectedTab === 'group-activity'}
				<GroupActivity {groupStats} />
			{:else if selectedTab === 'content-types'}
				<ContentTypes {contentTypeStats} />
			{:else if selectedTab === 'time-series'}
				<TimeSeries {timeSeriesStats} />
			{/if}
		</div>
	</div>
{/if} 