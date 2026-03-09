'use strict';

const BaseInvite = require('./BaseInvite');
const { GuildScheduledEvent } = require('./GuildScheduledEvent');
const IntegrationApplication = require('./IntegrationApplication');
const InviteStageInstance = require('./InviteStageInstance');
const { Error } = require('../errors');
const InviteFlags = require('../util/InviteFlags');
const Permissions = require('../util/Permissions');

/**
 * A channel invite leading to a guild.
 * @extends {BaseInvite}
 */
class GuildInvite extends BaseInvite {
  constructor(client, data) {
    super(client, data);

    // Type may be missing from audit logs
    this.type = data.type ?? 0;

    /**
     * The id of the guild this invite is for
     * @type {Snowflake}
     */
    // Guild id may be missing from audit logs
    this.guildId = data.guild_id ?? data.guild?.id ?? null;
  }

  _patch(data) {
    super._patch(data);

    const InviteGuild = require('./InviteGuild');

    if ('flags' in data) {
      /**
       * The flags of this invite
       * @type {Readonly<InviteFlags>}
       */
      this.flags = new InviteFlags(data.flags).freeze();
    } else {
      this.flags ??= new InviteFlags().freeze();
    }

    if ('guild' in data) {
      /**
       * The guild the invite is for including welcome screen data if present
       * @type {?(Guild|InviteGuild)}
       */
      this.guild = this.client.guilds.cache.get(data.guild.id) ?? new InviteGuild(this.client, data.guild);
      this.guildId ??= data.guild.id;
    } else {
      this.guild ??= null;
    }

    if ('channel_id' in data) {
      this.channel = this.client.channels.cache.get(data.channel_id);
    }

    if ('channel' in data && data.channel !== null) {
      /**
       * The channel this invite is for
       * @type {?Channel}
       */
      this.channel ??= this.client.channels._add(data.channel, this.guild, { cache: false });
      this.channelId ??= data.channel.id;
    }

    if ('target_type' in data) {
      /**
       * The target type
       * @type {?TargetType}
       */
      this.targetType = data.target_type;
    } else {
      this.targetType ??= null;
    }

    if ('target_user' in data) {
      /**
       * The user whose stream to display for this voice channel stream invite
       * @type {?User}
       */
      this.targetUser = this.client.users._add(data.target_user);
    } else {
      this.targetUser ??= null;
    }

    if ('target_application' in data) {
      /**
       * The embedded application to open for this voice channel embedded application invite
       * @type {?IntegrationApplication}
       */
      this.targetApplication = new IntegrationApplication(this.client, data.target_application);
    } else {
      this.targetApplication ??= null;
    }

    if ('guild_scheduled_event' in data) {
      /**
       * The guild scheduled event data if there is a {@link GuildScheduledEvent} in the channel
       * @type {?GuildScheduledEvent}
       */
      this.guildScheduledEvent = new GuildScheduledEvent(this.client, data.guild_scheduled_event);
    } else {
      this.guildScheduledEvent ??= null;
    }

    if ('stage_instance' in data) {
      /**
       * The stage instance data if there is a public {@link StageInstance} in the stage channel this invite is for
       * @type {?InviteStageInstance}
       */
      this.stageInstance = new InviteStageInstance(this.client, data.stage_instance, this.channel?.id, this.guild?.id);
    } else {
      this.stageInstance ??= null;
    }

    if ('uses' in data) {
      /**
       * How many times this invite has been used
       * @type {?number}
       */
      this.uses = data.uses;
    } else {
      this.uses ??= null;
    }

    if ('max_uses' in data) {
      /**
       * The maximum uses of this invite
       * @type {?number}
       */
      this.maxUses = data.max_uses;
    } else {
      this.maxUses ??= null;
    }

    if ('temporary' in data) {
      /**
       * Whether or not this invite only grants temporary membership
       * @type {?boolean}
       */
      this.temporary = data.temporary ?? null;
    } else {
      this.temporary ??= null;
    }

    if ('approximate_presence_count' in data) {
      /**
       * The approximate number of online members of the guild
       * @type {?number}
       */
      this.presenceCount = data.approximate_presence_count;
    } else {
      this.presenceCount ??= null;
    }
  }

  /**
   * Whether the invite is deletable by the client user
   * @type {boolean}
   * @readonly
   */
  get deletable() {
    const guild = this.guild;
    if (!guild || !this.client.guilds.cache.has(guild.id)) return false;
    if (!guild.members.me) throw new Error('GUILD_UNCACHED_ME');
    return (
      this.channel.permissionsFor(this.client.user).has(Permissions.FLAGS.MANAGE_CHANNELS, false) ||
      guild.members.me.permissions.has(Permissions.FLAGS.MANAGE_GUILD)
    );
  }

  /**
   * Deletes this invite.
   * @param {string} [reason] Reason for deleting this invite
   * @returns {Promise<GuildInvite>}
   */
  async delete(reason) {
    await this.client.api.invites[this.code].delete({ reason });
    return this;
  }

  toJSON() {
    return super.toJSON({
      url: true,
      expiresTimestamp: true,
      presenceCount: false,
      memberCount: false,
      uses: false,
      channel: 'channelId',
      inviter: 'inviterId',
      guild: 'guildId',
    });
  }
}

module.exports = GuildInvite;
